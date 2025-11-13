import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { createClient } from '@/lib/supabase/server'

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
  base: {
    sha: string
    ref: string
  }
  head: {
    sha: string
    ref: string
  }
  user: {
    login: string
  }
}

type GitHubComment = {
  id: number
  body: string
  user: {
    login: string
    type: string
  }
}

type PRAdviceSuggestion = {
  file: string
  reason: string
}

type PRAdviceResult = {
  codeFiles: string[]
  docFiles: string[]
  importantCodeChanged: boolean
  docsChanged: boolean
  docSuggestions: PRAdviceSuggestion[]
  allFiles: Array<{
    path: string
    status: 'added' | 'modified' | 'removed' | 'renamed'
  }>
}

/**
 * Classify a file as code, docs, or other based on path and extension
 */
function classifyFile(filename: string): 'code' | 'docs' | 'other' {
  const lowerFilename = filename.toLowerCase()
  
  // Code file patterns
  const codePatterns = [
    /^src\//,
    /^app\//,
    /^lib\//,
    /^server\//,
    /^components\//,
    /^pages\//,
  ]
  
  const codeExtensions = [
    '.ts', '.tsx', '.js', '.jsx',
    '.go', '.py', '.java', '.cpp', '.c',
    '.rs', '.rb', '.php', '.swift', '.kt',
  ]
  
  // Docs file patterns
  const docPatterns = [
    /^docs\//,
    /^documentation\//,
  ]
  
  // Check if it's a code file
  const isCodePath = codePatterns.some(pattern => pattern.test(filename))
  const isCodeExtension = codeExtensions.some(ext => lowerFilename.endsWith(ext))
  
  if (isCodePath || isCodeExtension) {
    return 'code'
  }
  
  // Check if it's a docs file
  const isDocPath = docPatterns.some(pattern => pattern.test(filename))
  const isMarkdown = lowerFilename.endsWith('.md')
  const isDocFile = lowerFilename === 'readme.md' || 
                    lowerFilename === 'changelog.md' ||
                    lowerFilename.startsWith('readme') ||
                    lowerFilename.startsWith('changelog')
  
  if (isDocPath || (isMarkdown && isDocFile)) {
    return 'docs'
  }
  
  // Markdown files are generally docs
  if (isMarkdown) {
    return 'docs'
  }
  
  return 'other'
}

/**
 * Step 1: Classify files as code vs docs
 * Step 2: Determine if important code changed
 * Step 3: Determine if docs changed
 */
function analyzePRChanges(files: GitHubPRFile[]): PRAdviceResult {
  const codeFiles: string[] = []
  const docFiles: string[] = []
  
  // Step 1: Classify each file (excluding removed files from classification)
  // but including them in the allFiles list for display
  for (const file of files) {
    // Only classify non-removed files for code/docs detection
    if (file.status !== 'removed') {
      const classification = classifyFile(file.filename)
      if (classification === 'code') {
        codeFiles.push(file.filename)
      } else if (classification === 'docs') {
        docFiles.push(file.filename)
      }
    }
  }
  
  // Step 2: Did important code change?
  // For v1, "important code changed" = any code file changed
  const importantCodeChanged = codeFiles.length > 0
  
  // Step 3: Did docs change?
  const docsChanged = docFiles.length > 0
  
  // Step 4: Generate suggestions based on simple rules
  const docSuggestions: PRAdviceSuggestion[] = []
  
  // Rule: Code changed but no docs changed → suggest updating docs
  if (importantCodeChanged && !docsChanged) {
    // Suggest common doc files that might need updating
    if (!docFiles.some(f => f.toLowerCase().includes('readme'))) {
      docSuggestions.push({
        file: 'README.md',
        reason: 'Code changes detected but README was not updated',
      })
    }
    
    if (!docFiles.some(f => f.toLowerCase().includes('changelog'))) {
      docSuggestions.push({
        file: 'CHANGELOG.md',
        reason: 'Code changes detected but CHANGELOG was not updated',
      })
    }
    
    // Check if there's a docs/ directory that might need updating
    const hasDocsDir = docFiles.some(f => f.startsWith('docs/'))
    if (!hasDocsDir) {
      docSuggestions.push({
        file: 'docs/',
        reason: 'Code changes detected but documentation in docs/ was not updated',
      })
    }
  }
  
  // Collect all files with their status
  const allFiles = files.map(f => ({
    path: f.filename,
    status: f.status,
  }))

  return {
    codeFiles,
    docFiles,
    importantCodeChanged,
    docsChanged,
    docSuggestions,
    allFiles,
  }
}

/**
 * Generate comment body based on simple rules:
 * 1. Code + Docs changed → positive comment
 * 2. Code changed but no docs → suggest updating docs
 * 3. Only docs changed → optional comment or skip
 */
function generateCommentBody(
  repoFullName: string,
  prNumber: number,
  prTitle: string,
  advice: PRAdviceResult
): string | null {
  // Case 3: Only docs changed → skip commenting (or optional positive comment)
  if (!advice.importantCodeChanged && advice.docsChanged) {
    // Return null to skip commenting for docs-only PRs
    return null
  }
  
  // Helper function to format file list
  const formatFileList = (files: typeof advice.allFiles) => {
    const added = files.filter(f => f.status === 'added')
    const modified = files.filter(f => f.status === 'modified')
    const removed = files.filter(f => f.status === 'removed')
    const renamed = files.filter(f => f.status === 'renamed')
    
    let list = ''
    
    if (added.length > 0) {
      list += `\n### Added\n${added.map(f => `- \`${f.path}\``).join('\n')}\n`
    }
    
    if (modified.length > 0) {
      list += `\n### Modified\n${modified.map(f => `- \`${f.path}\``).join('\n')}\n`
    }
    
    if (removed.length > 0) {
      list += `\n### Removed\n${removed.map(f => `- \`${f.path}\``).join('\n')}\n`
    }
    
    if (renamed.length > 0) {
      list += `\n### Renamed\n${renamed.map(f => `- \`${f.path}\``).join('\n')}\n`
    }
    
    return list
  }

  // Case 1: Code + Docs changed → positive comment
  if (advice.importantCodeChanged && advice.docsChanged) {
    return `<!-- codekeeper:advice:v1 -->

## 👋 Codekeeper

Nice! I see you updated docs along with code changes 👌

**Code files changed:** ${advice.codeFiles.length}  
**Docs files updated:** ${advice.docFiles.length}

### Files changed

${formatFileList(advice.allFiles)}

Keep up the good work!
`
  }
  
  // Case 2: Code changed but no docs → suggest updating docs
  if (advice.importantCodeChanged && !advice.docsChanged) {
    let body = `<!-- codekeeper:advice:v1 -->

## 👋 Codekeeper

I noticed code changes but no documentation was updated in this PR.

### Files changed

${formatFileList(advice.allFiles)}

If this affects users or the public API, consider updating:

`

    if (advice.docSuggestions.length > 0) {
      advice.docSuggestions.forEach((suggestion) => {
        body += `- \`${suggestion.file}\` – ${suggestion.reason}\n`
      })
    }

    body += `\n> 💡 You can edit these suggestions before committing.\n`
    
    return body
  }
  
  // Fallback: shouldn't reach here, but return null
  return null
}

async function findExistingComment(
  owner: string,
  repo: string,
  prNumber: number,
  headers: HeadersInit
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      { headers, cache: 'no-store' }
    )

    if (!response.ok) return null

    const comments = (await response.json()) as GitHubComment[]
    const codekeeperComment = comments.find(
      (c) => c.body.includes('<!-- codekeeper:advice:v1 -->') || c.user.type === 'Bot'
    )

    return codekeeperComment?.id || null
  } catch (error) {
    console.error('Error finding existing comment:', error)
    return null
  }
}

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
    const repoFullName = `${owner}/${repo}`
    const prNumber = parseInt(resolvedParams.number, 10)

    // Try to parse request body if present
    let body: { run_id?: string; user_id?: string } = {}
    try {
      const contentType = request.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const text = await request.text()
        if (text) {
          body = JSON.parse(text)
        }
      }
    } catch (error) {
      // Body is optional, continue without it
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    // Create or update PR run
    let prRunId = body.run_id
    if (!prRunId) {
      const { data: prRun, error: dbError } = await supabase
        .from('pr_runs')
        .insert({
          user_id: user.id,
          repo_full_name: repoFullName,
          pr_number: prNumber,
          run_type: 'advice',
          status: 'running',
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
      } else {
        prRunId = prRun.id
      }
    } else {
      await supabase
        .from('pr_runs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', prRunId)
    }

    // 1. Get PR details
    const prResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      { headers, cache: 'no-store' }
    )

    if (!prResponse.ok) {
      if (prRunId) {
        await supabase
          .from('pr_runs')
          .update({ status: 'failed', logs: { error: 'Failed to fetch PR' } })
          .eq('id', prRunId)
      }
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
      if (prRunId) {
        await supabase
          .from('pr_runs')
          .update({ status: 'failed', logs: { error: 'Failed to fetch PR files' } })
          .eq('id', prRunId)
      }
      return NextResponse.json(
        { error: 'Failed to fetch PR files' },
        { status: filesResponse.status }
      )
    }

    const files = (await filesResponse.json()) as GitHubPRFile[]

    // 3. Analyze changes using simple classification
    // Include all files (added, modified, removed, renamed) for display
    const advice = analyzePRChanges(files)

    // 4. Generate comment body (may return null for docs-only PRs)
    const commentBody = generateCommentBody(repoFullName, prNumber, pr.title, advice)
    
    // If comment body is null, skip posting (docs-only PR)
    if (!commentBody) {
      if (prRunId) {
        await supabase
          .from('pr_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            logs: {
              codeFiles: advice.codeFiles,
              docFiles: advice.docFiles,
              importantCodeChanged: advice.importantCodeChanged,
              docsChanged: advice.docsChanged,
              skipped: true,
              reason: 'Docs-only PR, no comment needed',
            },
          })
          .eq('id', prRunId)
      }
      return NextResponse.json({
        success: true,
        run_id: prRunId,
        skipped: true,
        reason: 'Docs-only PR, no comment posted',
        advice,
      })
    }

    // 6. Find existing Codekeeper comment
    const existingCommentId = await findExistingComment(owner, repo, prNumber, headers)

    // 7. Post or update comment
    let commentId: number | null = null

    if (existingCommentId) {
      // Update existing comment
      const updateResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/comments/${existingCommentId}`,
        {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: commentBody }),
          cache: 'no-store',
        }
      )

      if (updateResponse.ok) {
        commentId = existingCommentId
      }
    } else {
      // Create new comment
      const createResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: commentBody }),
          cache: 'no-store',
        }
      )

      if (createResponse.ok) {
        const comment = await createResponse.json()
        commentId = comment.id
      }
    }

    // 8. Update PR run status
    if (prRunId) {
      await supabase
        .from('pr_runs')
        .update({
          status: commentId ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          github_comment_id: commentId,
          logs: {
            codeFiles: advice.codeFiles,
            docFiles: advice.docFiles,
            importantCodeChanged: advice.importantCodeChanged,
            docsChanged: advice.docsChanged,
            suggestions: advice.docSuggestions,
            changedFilesCount: advice.allFiles.length,
            fullCommentBody: commentBody, // Store the full comment body
          },
        })
        .eq('id', prRunId)
    }

    return NextResponse.json({
      success: true,
      run_id: prRunId,
      comment_id: commentId,
      advice,
    })
  } catch (error) {
    console.error('Error processing PR advice:', error)
    return NextResponse.json(
      { error: 'Failed to process PR advice' },
      { status: 500 }
    )
  }
}

