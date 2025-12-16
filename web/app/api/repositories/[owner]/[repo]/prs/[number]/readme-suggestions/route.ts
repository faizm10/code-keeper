import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { createClient } from '@/lib/supabase/server'
import { generateReadmeSuggestions, ReadmeSuggestion } from '@/lib/gemini/readme-suggestions'
import { classifyFile } from '@/lib/pr/file-classification'
import { discoverDocumentationFiles, getPrimaryDocumentationFiles, needsDocumentation } from '@/lib/gemini/documentation-discovery'
import { analyzeChangesForDocumentation, CodeChange } from '@/lib/gemini/documentation-analyzer'
import { determineDocumentationPlacement } from '@/lib/gemini/documentation-placer'

export const dynamic = 'force-dynamic'

type GitHubPRFile = {
  filename: string
  status: 'added' | 'modified' | 'removed' | 'renamed'
  additions: number
  deletions: number
  changes: number
  patch?: string
}

type GitHubPR = {
  number: number
  title: string
  state: string
  body?: string | null
  base: {
    ref: string
    sha: string
  }
}


/**
 * POST /api/repositories/[owner]/[repo]/prs/[number]/readme-suggestions
 * 
 * Generates README update suggestions based on PR changes
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string; number: string }> }
) {
  try {
    const { token, error } = await getGitHubAccessToken()

    if (error || !token) {
      return NextResponse.json(
        { error: error?.message || 'Missing GitHub access token' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const owner = decodeURIComponent(resolvedParams.owner)
    const repo = decodeURIComponent(resolvedParams.repo)
    const prNumber = parseInt(resolvedParams.number, 10)

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    // 1. Get PR details
    const prResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      { headers, cache: 'no-store' }
    )

    if (!prResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch PR' },
        { status: prResponse.status }
      )
    }

    const pr = (await prResponse.json()) as GitHubPR

    // 2. Get PR files
    const filesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      { headers, cache: 'no-store' }
    )

    if (!filesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch PR files' },
        { status: filesResponse.status }
      )
    }

    const files = (await filesResponse.json()) as GitHubPRFile[]

    // 3. Filter code files (exclude docs, config-only changes)
    const codeFiles = files.filter((file) => {
      if (file.status === 'removed') return false
      const classification = classifyFile(file.filename)
      return classification === 'code'
    })

    if (codeFiles.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'No code changes detected. README updates may not be necessary.',
      })
    }

    // 4. Discover all documentation files (prioritizing docs/ folder over README.md)
    let documentationFiles: Awaited<ReturnType<typeof discoverDocumentationFiles>> | null = null
    let currentReadme: string | null = null
    let readmeExists = false
    
    try {
      documentationFiles = await discoverDocumentationFiles(
        owner,
        repo,
        token,
        pr.base.ref
      )

      // Get primary documentation files (docs/ folder takes precedence)
      const primaryDocs = getPrimaryDocumentationFiles(documentationFiles.files)
      
      // Use primary docs if available, otherwise fall back to README
      if (primaryDocs.length > 0) {
        // Use the first primary doc file (or combine if multiple)
        currentReadme = primaryDocs[0].content
        readmeExists = true
        console.log(`Using primary documentation: ${primaryDocs[0].path}`)
      } else if (documentationFiles.hasRootReadme) {
        // Fallback to README.md
        const readmeFile = documentationFiles.files.find(f => f.type === 'readme')
        if (readmeFile) {
          currentReadme = readmeFile.content
          readmeExists = true
          console.log(`Using fallback README.md`)
        }
      }

      // Log discovery results
      console.log('Documentation discovery:', {
        totalFiles: documentationFiles.totalFiles,
        hasPrimaryDocs: documentationFiles.hasPrimaryDocs,
        hasRootReadme: documentationFiles.hasRootReadme,
        files: documentationFiles.files.map(f => ({ path: f.path, type: f.type, priority: f.priority })),
      })
    } catch (discoveryError) {
      console.error('Error discovering documentation files:', discoveryError)
      // Fallback to old method if discovery fails
      try {
        const readmeContentResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/README.md?ref=${pr.base.ref}`,
          { headers, cache: 'no-store' }
        )
        if (readmeContentResponse.ok) {
          const readmeData = await readmeContentResponse.json()
          if (readmeData.content) {
            currentReadme = Buffer.from(readmeData.content, 'base64').toString('utf-8')
            readmeExists = true
          }
        }
      } catch (fetchError) {
        console.error('Error fetching README.md fallback:', fetchError)
      }
    }

    // 5. Prepare code changes with full patches for deep analysis
    const codeChangesForAnalysis: CodeChange[] = codeFiles
      .filter((file) => file.status !== 'renamed')
      .map((file) => ({
        path: file.filename,
        status: file.status as 'added' | 'modified' | 'removed',
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
      }))

    // 6. Deep AI analysis of changes to understand what documentation needs updating
    let changeAnalysis = null
    let detectedEvents: string[] = []
    let missingDocs: string[] = []
    
    try {
      changeAnalysis = await analyzeChangesForDocumentation({
        prTitle: pr.title,
        prNumber,
        prBody: pr.body || undefined,
        codeChanges: codeChangesForAnalysis,
        existingDocumentation: documentationFiles?.files || [],
        detectedEvents: [], // Will be populated from analysis
      })

      // Use detected features as events
      detectedEvents = changeAnalysis.detectedFeatures
      
      // Build missing docs list from analysis
      if (changeAnalysis.newDocsNeeded.length > 0) {
        missingDocs = changeAnalysis.newDocsNeeded.map(doc => doc.filePath)
      }

      console.log('Change analysis result:', {
        changesSummary: changeAnalysis.changesSummary,
        affectedDocsCount: changeAnalysis.affectedDocs.length,
        newDocsNeededCount: changeAnalysis.newDocsNeeded.length,
        detectedFeatures: changeAnalysis.detectedFeatures.length,
        breakingChanges: changeAnalysis.detectedBreakingChanges,
        confidence: changeAnalysis.confidence,
      })
    } catch (analysisError) {
      console.error('Error in change analysis:', analysisError)
      // Fallback to simple event detection
      codeFiles.forEach((file) => {
        if (file.patch) {
          if (file.patch.match(/app\.(get|post|put|delete|patch)\(/)) {
            detectedEvents.push('NewEndpoint')
          }
          if (file.patch.match(/export\s+(?:async\s+)?(?:function|const|class)/)) {
            detectedEvents.push('NewPublicFunction')
          }
          if (file.filename.match(/\.env|config|settings/i)) {
            detectedEvents.push('NewEnvVar')
          }
        }
      })
    }

    // 7. Prepare simplified code changes for README suggestions (backward compatibility)
    const codeChanges = codeChangesForAnalysis.map((change) => {
      let summary = `${change.additions} additions, ${change.deletions} deletions`
      
      if (change.patch) {
        const newFunctionMatch = change.patch.match(/^\+\s*(?:export\s+)?(?:async\s+)?(?:function|const|class)\s+(\w+)/m)
        const newEndpointMatch = change.patch.match(/^\+\s*(?:app|router)\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/m)
        
        if (newEndpointMatch) {
          summary = `New ${newEndpointMatch[1].toUpperCase()} endpoint: ${newEndpointMatch[2]}`
        } else if (newFunctionMatch) {
          summary = `New function/class: ${newFunctionMatch[1]}`
        }
      }

      return {
        path: change.path,
        status: change.status,
        summary,
        additions: change.additions,
        deletions: change.deletions,
      }
    })

    // 8. Determine intelligent placement for documentation updates
    let placementResult = null
    if (changeAnalysis) {
      try {
        placementResult = await determineDocumentationPlacement({
          changeAnalysis,
          existingDocumentation: documentationFiles?.files || [],
          prTitle: pr.title,
          prNumber,
        })

        console.log('Documentation placement result:', {
          placementsCount: placementResult.placements.length,
          filesAffected: new Set(placementResult.placements.map(p => p.targetFile)).size,
          summary: placementResult.summary,
          confidence: placementResult.confidence,
        })
      } catch (placementError) {
        console.error('Error determining documentation placement:', placementError)
        // Continue with fallback suggestions
      }
    }

    // 9. Generate README suggestions using Gemini (enhanced with change analysis and placement)
    // Convert placements to suggestions format for backward compatibility
    let suggestions
    
    if (placementResult && placementResult.placements.length > 0) {
      // Use intelligent placements to generate suggestions
      const placementSuggestions: ReadmeSuggestion[] = placementResult.placements.map((placement, index) => ({
        section: placement.targetSection,
        suggestedContent: placement.content,
        reason: placement.reason,
        priority: placement.priority,
        // Add metadata about target file
        currentContent: undefined, // Will be filled if updating existing section
      }))

      // Try to get current content for sections being updated
      for (const suggestion of placementSuggestions) {
        const targetFile = placementResult.placements.find(p => p.targetSection === suggestion.section)?.targetFile
        if (targetFile) {
          const docFile = documentationFiles?.files.find(f => f.path === targetFile)
          if (docFile) {
            // Try to extract current section content
            const sectionRegex = new RegExp(
              `(^##+\\s+${escapeRegex(suggestion.section)}[^#]*?)(?=^##|$)`,
              'gmsi'
            )
            const match = docFile.content.match(sectionRegex)
            if (match) {
              suggestion.currentContent = match[1]
            }
          }
        }
      }

      suggestions = {
        suggestions: placementSuggestions,
        summary: placementResult.summary,
        confidence: placementResult.confidence,
      }
    } else {
      // Fallback to original suggestion generation
      suggestions = await generateReadmeSuggestions({
        prTitle: pr.title,
        prNumber,
        codeChanges,
        currentReadme: currentReadme ?? undefined,
        detectedEvents: changeAnalysis?.detectedFeatures || detectedEvents,
        missingDocs: changeAnalysis?.newDocsNeeded.map(d => d.filePath) || missingDocs,
      })
    }

    // Helper function for regex escaping
    function escapeRegex(str: string): string {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    // 10. Store suggestions, analysis, and placement in database
    const { data: prRun } = await supabase
      .from('pr_runs')
      .select('id')
      .eq('repo_full_name', `${owner}/${repo}`)
      .eq('pr_number', prNumber)
      .eq('run_type', 'advice')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (prRun) {
      await supabase
        .from('pr_runs')
        .update({
          logs: {
            readmeSuggestions: suggestions,
            readmeSuggestionsGeneratedAt: new Date().toISOString(),
            changeAnalysis: changeAnalysis ? {
              changesSummary: changeAnalysis.changesSummary,
              affectedDocs: changeAnalysis.affectedDocs,
              newDocsNeeded: changeAnalysis.newDocsNeeded,
              detectedFeatures: changeAnalysis.detectedFeatures,
              breakingChanges: changeAnalysis.detectedBreakingChanges,
              confidence: changeAnalysis.confidence,
            } : null,
            placementResult: placementResult ? {
              placements: placementResult.placements,
              summary: placementResult.summary,
              confidence: placementResult.confidence,
            } : null,
          },
        })
        .eq('id', prRun.id)
    }

    // Check if README suggestions have been applied
    let readmeAppliedStatus = null
    try {
      const { data: appliedRun } = await supabase
        .from('pr_runs')
        .select('id, status, logs, completed_at')
        .eq('repo_full_name', `${owner}/${repo}`)
        .eq('pr_number', prNumber)
        .eq('run_type', 'readme_apply')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (appliedRun) {
        readmeAppliedStatus = {
          id: appliedRun.logs?.readme_apply_id || null,
          status: appliedRun.status,
          readmePrNumber: appliedRun.logs?.readme_pr_number || null,
          completedAt: appliedRun.completed_at || null,
          merged: appliedRun.status === 'completed',
        }
      }
    } catch (error) {
      // Ignore errors - status check is optional
      console.log('Could not check README applied status:', error)
    }

    const needsDocs = documentationFiles ? needsDocumentation(documentationFiles) : !readmeExists

    return NextResponse.json({
      success: true,
      suggestions: suggestions.suggestions,
      summary: suggestions.summary,
      confidence: suggestions.confidence,
      codeFilesCount: codeFiles.length,
      readmeExists: currentReadme !== null,
      currentReadme: currentReadme || undefined,
      appliedStatus: readmeAppliedStatus,
      documentationFiles: documentationFiles ? {
        totalFiles: documentationFiles.totalFiles,
        hasPrimaryDocs: documentationFiles.hasPrimaryDocs,
        hasRootReadme: documentationFiles.hasRootReadme,
        files: documentationFiles.files.map(f => ({
          path: f.path,
          type: f.type,
          priority: f.priority,
          size: f.size,
        })),
      } : null,
      needsDocumentation: needsDocs,
      changeAnalysis: changeAnalysis ? {
        changesSummary: changeAnalysis.changesSummary,
        affectedDocs: changeAnalysis.affectedDocs,
        newDocsNeeded: changeAnalysis.newDocsNeeded.map(d => ({
          filePath: d.filePath,
          type: d.type,
          reason: d.reason,
          priority: d.priority,
          suggestedStructure: d.suggestedStructure,
        })),
        detectedFeatures: changeAnalysis.detectedFeatures,
        detectedApiEndpoints: changeAnalysis.detectedApiEndpoints || [],
        detectedFunctions: changeAnalysis.detectedFunctions || [],
        breakingChanges: changeAnalysis.detectedBreakingChanges,
        breakingChangesDescription: changeAnalysis.breakingChangesDescription,
        newDeveloperContext: changeAnalysis.newDeveloperContext,
        confidence: changeAnalysis.confidence,
      } : null,
      placementResult: placementResult ? {
        placements: placementResult.placements.map(p => ({
          targetFile: p.targetFile,
          targetSection: p.targetSection,
          action: p.action,
          content: p.content,
          reason: p.reason,
          priority: p.priority,
          order: p.order,
        })),
        summary: placementResult.summary,
        confidence: placementResult.confidence,
      } : null,
    })
  } catch (error) {
    console.error('Error generating README suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate README suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

