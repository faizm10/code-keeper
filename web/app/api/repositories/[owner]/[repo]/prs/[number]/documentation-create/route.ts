import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { createClient } from '@/lib/supabase/server'
import { generateCompleteReadme } from '@/lib/gemini/readme-generator'
import { ReadmeSuggestion } from '@/lib/gemini/readme-suggestions'
import { discoverDocumentationFiles, getPrimaryDocumentationFiles } from '@/lib/gemini/documentation-discovery'
import { determineDocumentationPlacement } from '@/lib/gemini/documentation-placer'
import { analyzeChangesForDocumentation, CodeChange } from '@/lib/gemini/documentation-analyzer'

export const dynamic = 'force-dynamic'

type GitHubPR = {
  number: number
  title: string
  body: string | null
  base: {
    ref: string
    sha: string
  }
  head: {
    ref: string
    sha: string
  }
}

/**
 * POST /api/repositories/[owner]/[repo]/prs/[number]/documentation-create
 * 
 * Creates new documentation files based on user selection
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

    // Parse request body
    const body = await request.json()
    const { filesToCreate }: { filesToCreate: string[] } = body

    if (!filesToCreate || filesToCreate.length === 0) {
      return NextResponse.json(
        { error: 'No files specified for creation' },
        { status: 400 }
      )
    }

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

    // 2. Get PR files for analysis
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

    const files = (await filesResponse.json()) as Array<{
      filename: string
      status: 'added' | 'modified' | 'removed' | 'renamed'
      additions: number
      deletions: number
      patch?: string
    }>

    // 3. Analyze changes to generate content
    const codeFiles = files.filter(f => 
      f.status !== 'removed' && 
      !f.filename.match(/\.md$|^docs\//)
    )

    const codeChangesForAnalysis: CodeChange[] = codeFiles.map((file) => ({
      path: file.filename,
      status: file.status as 'added' | 'modified' | 'removed',
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch,
    }))

    // 4. Discover existing documentation
    const documentationFiles = await discoverDocumentationFiles(
      owner,
      repo,
      token,
      pr.base.ref
    )

    // 5. Analyze changes
    const changeAnalysis = await analyzeChangesForDocumentation({
      prTitle: pr.title,
      prNumber,
      prBody: pr.body || undefined,
      codeChanges: codeChangesForAnalysis,
      existingDocumentation: documentationFiles.files,
      detectedEvents: [],
    })

    // 6. Get placement decisions
    const placementResult = await determineDocumentationPlacement({
      changeAnalysis,
      existingDocumentation: documentationFiles.files,
      prTitle: pr.title,
      prNumber,
    })

    // 7. Filter placements to only selected files, or generate from newDocsNeeded
    let selectedPlacements = placementResult.placements.filter(p =>
      filesToCreate.includes(p.targetFile)
    )

    // If no placements match, generate content directly from newDocsNeeded
    if (selectedPlacements.length === 0) {
      // Create placements from newDocsNeeded for selected files
      const selectedNewDocs = changeAnalysis.newDocsNeeded.filter(doc =>
        filesToCreate.includes(doc.filePath)
      )

      if (selectedNewDocs.length === 0) {
        return NextResponse.json(
          { error: 'No valid files found to create' },
          { status: 400 }
        )
      }

      // Generate basic content for each selected file
      selectedPlacements = selectedNewDocs.map((doc, index) => {
        // Generate a basic structure based on the file type
        let content = ''
        const sections = doc.suggestedStructure || []

        // Get API endpoints and functions from change analysis if available
        const apiEndpoints = changeAnalysis.detectedApiEndpoints || []
        const functions = changeAnalysis.detectedFunctions || []
        
        if (doc.type === 'readme') {
          content = `# ${doc.filePath.replace(/\.mdx?$/, '').split('/').pop() || 'Documentation'}\n\n`
          if (sections.length > 0) {
            content += sections.map(s => `## ${s}\n\n(Content to be added)\n`).join('\n')
          } else {
            content += '## Overview\n\n(Add project overview here)\n\n## Getting Started\n\n(Add getting started instructions here)\n'
          }
          
          // Add API section if endpoints exist
          if (apiEndpoints.length > 0) {
            content += '\n## Key API Endpoints\n\n'
            apiEndpoints.slice(0, 5).forEach(endpoint => {
              content += `### ${endpoint.method} ${endpoint.path}\n\n${endpoint.description}\n\n`
              if (endpoint.usageExample) {
                content += `\`\`\`javascript\n${endpoint.usageExample}\n\`\`\`\n\n`
              }
            })
          }
        } else if (doc.type === 'docs' || doc.type === 'api') {
          content = `# ${doc.filePath.replace(/\.mdx?$/, '').split('/').pop() || 'API Documentation'}\n\n`
          if (sections.length > 0) {
            content += sections.map(s => `## ${s}\n\n(Content to be added)\n`).join('\n')
          } else {
            content += '## Overview\n\n(Add API documentation here)\n\n'
          }
          
          // Add detailed API documentation
          if (apiEndpoints.length > 0) {
            content += '\n## API Endpoints\n\n'
            apiEndpoints.forEach(endpoint => {
              content += `### ${endpoint.method} ${endpoint.path}\n\n${endpoint.description}\n\n`
              if (endpoint.parameters && endpoint.parameters.length > 0) {
                content += '**Parameters:**\n\n'
                endpoint.parameters.forEach(param => {
                  content += `- \`${param.name}\` (${param.type}${param.required ? ', required' : ', optional'}): ${param.description}\n`
                })
                content += '\n'
              }
              if (endpoint.requestBody) {
                content += `**Request Body:** ${endpoint.requestBody.type}\n\n${endpoint.requestBody.description}\n\n`
                if (endpoint.requestBody.example) {
                  content += `\`\`\`json\n${endpoint.requestBody.example}\n\`\`\`\n\n`
                }
              }
              if (endpoint.response) {
                content += `**Response:** ${endpoint.response.type}\n\n${endpoint.response.description}\n\n`
                if (endpoint.response.example) {
                  content += `\`\`\`json\n${endpoint.response.example}\n\`\`\`\n\n`
                }
              }
              if (endpoint.authentication) {
                content += `**Authentication:** ${endpoint.authentication}\n\n`
              }
              if (endpoint.usageExample) {
                content += `**Usage Example:**\n\n\`\`\`javascript\n${endpoint.usageExample}\n\`\`\`\n\n`
              }
              content += '---\n\n'
            })
          }
          
          // Add function documentation
          if (functions.length > 0) {
            content += '\n## Important Functions\n\n'
            functions.forEach(func => {
              content += `### ${func.name}\n\n${func.description}\n\n`
              if (func.parameters && func.parameters.length > 0) {
                content += '**Parameters:**\n\n'
                func.parameters.forEach(param => {
                  content += `- \`${param.name}\` (${param.type}): ${param.description}\n`
                })
                content += '\n'
              }
              if (func.returnType) {
                content += `**Returns:** ${func.returnType}\n\n`
              }
              if (func.whenToUse) {
                content += `**When to use:** ${func.whenToUse}\n\n`
              }
              if (func.usageExample) {
                content += `**Usage Example:**\n\n\`\`\`javascript\n${func.usageExample}\n\`\`\`\n\n`
              }
              content += '---\n\n'
            })
          }
        } else if (doc.type === 'changelog') {
          content = `# Changelog\n\n## ${new Date().toISOString().split('T')[0]}\n\n### Added\n\n- ${doc.reason}\n`
        } else {
          content = `# ${doc.filePath.replace(/\.mdx?$/, '').split('/').pop() || 'Documentation'}\n\n${doc.reason}\n\n`
          if (sections.length > 0) {
            content += sections.map(s => `## ${s}\n\n(Content to be added)\n`).join('\n')
          }
        }
        
        // Add new developer context if available
        if (changeAnalysis.newDeveloperContext) {
          content += `\n## For New Developers\n\n${changeAnalysis.newDeveloperContext}\n`
        }

        return {
          targetFile: doc.filePath,
          targetSection: sections[0] || 'Overview',
          action: 'create' as const,
          content: content.trim(),
          reason: doc.reason,
          priority: doc.priority,
          order: index + 1,
        }
      })
    }

    // 8. Create branch
    const branchName = `codekeeper-docs-${prNumber}-${Date.now()}`
    
    const baseCommitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${pr.head.sha}`,
      { headers, cache: 'no-store' }
    )

    if (!baseCommitResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get base commit' },
        { status: baseCommitResponse.status }
      )
    }

    const baseCommit = await baseCommitResponse.json()

    const createBranchResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseCommit.sha,
        }),
        cache: 'no-store',
      }
    )

    if (!createBranchResponse.ok) {
      const errorText = await createBranchResponse.text()
      return NextResponse.json(
        { error: 'Failed to create branch', details: errorText },
        { status: createBranchResponse.status }
      )
    }

    // 9. Group placements by file and create/update files
    const fileContents = new Map<string, string>()
    
    for (const placement of selectedPlacements) {
      if (!fileContents.has(placement.targetFile)) {
        // Check if file exists
        const existingFile = documentationFiles.files.find(f => f.path === placement.targetFile)
        if (existingFile) {
          fileContents.set(placement.targetFile, existingFile.content)
        } else {
          // New file - start with basic structure
          fileContents.set(placement.targetFile, '')
        }
      }

      let currentContent = fileContents.get(placement.targetFile) || ''

      // Apply placement based on action
      if (placement.action === 'create') {
        // New file - use the content as-is
        currentContent = placement.content
      } else if (placement.action === 'create_section') {
        // Add new section
        currentContent += `\n\n${placement.content}\n`
      } else if (placement.action === 'update') {
        // Update existing section
        const sectionRegex = new RegExp(
          `(^##+\\s+${escapeRegex(placement.targetSection)}[^#]*?)(?=^##|$)`,
          'gmsi'
        )
        if (sectionRegex.test(currentContent)) {
          currentContent = currentContent.replace(
            sectionRegex,
            `## ${placement.targetSection}\n\n${placement.content}\n\n`
          )
        } else {
          // Section doesn't exist, append it
          currentContent += `\n\n## ${placement.targetSection}\n\n${placement.content}\n`
        }
      } else if (placement.action === 'append') {
        // Append to existing section
        const sectionRegex = new RegExp(
          `(^##+\\s+${escapeRegex(placement.targetSection)}[^#]*?)(?=^##|$)`,
          'gmsi'
        )
        if (sectionRegex.test(currentContent)) {
          currentContent = currentContent.replace(
            sectionRegex,
            (match) => `${match}\n\n${placement.content}`
          )
        } else {
          currentContent += `\n\n## ${placement.targetSection}\n\n${placement.content}\n`
        }
      }

      fileContents.set(placement.targetFile, currentContent)
    }

    // 10. Create/update files in GitHub
    const createdFiles: Array<{ path: string; sha?: string }> = []
    
    for (const [filePath, content] of fileContents.entries()) {
      const contentBase64 = Buffer.from(content).toString('base64')
      const message = `docs: Create ${filePath} based on PR #${prNumber}`

      // Check if file exists
      let fileSha: string | undefined
      try {
        const fileResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`,
          { headers, cache: 'no-store' }
        )

        if (fileResponse.ok) {
          const fileData = await fileResponse.json()
          fileSha = fileData.sha
          message.replace('Create', 'Update')
        }
      } catch (error) {
        // File doesn't exist, will create new one
      }

      const createFileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            content: contentBase64,
            branch: branchName,
            ...(fileSha ? { sha: fileSha } : {}),
          }),
          cache: 'no-store',
        }
      )

      if (createFileResponse.ok) {
        const fileResult = await createFileResponse.json()
        createdFiles.push({ path: filePath, sha: fileResult.content?.sha })
      } else {
        const errorText = await createFileResponse.text()
        console.error(`Failed to create ${filePath}:`, errorText)
      }
    }

    // 11. Create pull request
    let newPrNumber: number | null = null
    if (createdFiles.length > 0) {
      const prBody = `## 📝 New Documentation Created

This PR creates ${createdFiles.length} new documentation file${createdFiles.length > 1 ? 's' : ''} based on code changes in PR #${prNumber}:

${createdFiles.map(f => `- \`${f.path}\``).join('\n')}

**Generated by Code Keeper** • Based on analysis of PR #${prNumber}

> 💡 **Note:** This PR was automatically generated. Please review the content and adjust as needed before merging.`

      const prResponse2 = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `📝 Create documentation for PR #${prNumber}`,
            body: prBody,
            head: branchName,
            base: pr.head.ref,
          }),
          cache: 'no-store',
        }
      )

      if (prResponse2.ok) {
        const newPr = await prResponse2.json()
        newPrNumber = newPr.number
      }
    }

    return NextResponse.json({
      success: true,
      branch: branchName,
      filesCreated: createdFiles.map(f => f.path),
      pullRequestNumber: newPrNumber,
      message: newPrNumber
        ? `Documentation created and PR #${newPrNumber} opened`
        : 'Documentation created (PR creation failed)',
    })
  } catch (error) {
    console.error('Error creating documentation:', error)
    return NextResponse.json(
      {
        error: 'Failed to create documentation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

