import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { createClient } from '@/lib/supabase/server'
import { generateReadmeSuggestions, ReadmeSuggestion } from '@/lib/gemini/readme-suggestions'
import { classifyFile } from '@/lib/pr/file-classification'

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
 * Fetch README content from GitHub
 */
async function fetchReadmeContent(
  owner: string,
  repo: string,
  token: string,
  ref: string = 'main'
): Promise<string | null> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  try {
    // Try to get README from the base branch
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/README.md?ref=${ref}`,
      { headers, cache: 'no-store' }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.content && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }
    }
  } catch (error) {
    console.error('Error fetching README:', error)
  }

  return null
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

    // 4. Get current README content
    const currentReadme = await fetchReadmeContent(owner, repo, token, pr.base.ref)

    // 5. Prepare code changes summary
    const codeChanges = codeFiles
      .filter((file) => file.status !== 'renamed') // Filter out renamed files
      .map((file) => {
        // Extract meaningful summary from patch or use file info
        let summary = `${file.additions} additions, ${file.deletions} deletions`
        
        if (file.patch) {
          // Try to extract key information from patch
          const newFunctionMatch = file.patch.match(/^\+\s*(?:export\s+)?(?:async\s+)?(?:function|const|class)\s+(\w+)/m)
          const newEndpointMatch = file.patch.match(/^\+\s*(?:app|router)\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/m)
          
          if (newEndpointMatch) {
            summary = `New ${newEndpointMatch[1].toUpperCase()} endpoint: ${newEndpointMatch[2]}`
          } else if (newFunctionMatch) {
            summary = `New function/class: ${newFunctionMatch[1]}`
          }
        }

        return {
          path: file.filename,
          status: file.status as 'added' | 'modified' | 'removed',
          summary,
          additions: file.additions,
          deletions: file.deletions,
        }
      })

    // 6. Detect events (simplified - in production, use the full PR analysis)
    const detectedEvents: string[] = []
    const missingDocs: string[] = []

    // Check if README was modified
    const readmeModified = files.some((f) => 
      f.filename.toLowerCase() === 'readme.md' && f.status !== 'removed'
    )

    if (!readmeModified && codeFiles.length > 0) {
      missingDocs.push('README.md')
    }

    // Simple event detection
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

    // 7. Generate README suggestions using Gemini
    const suggestions = await generateReadmeSuggestions({
      prTitle: pr.title,
      prNumber,
      codeChanges,
      currentReadme: currentReadme ?? undefined,
      detectedEvents,
      missingDocs,
    })

    // 8. Store suggestions in database (optional)
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
          },
        })
        .eq('id', prRun.id)
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions.suggestions,
      summary: suggestions.summary,
      confidence: suggestions.confidence,
      codeFilesCount: codeFiles.length,
      readmeExists: currentReadme !== null,
    })
  } catch (error) {
    console.error('Error generating README suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate README suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

