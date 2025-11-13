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
  suggestion?: string
}

type PRAdviceResult = {
  changedFiles: Array<{
    path: string
    status: string
  }>
  docSuggestions: PRAdviceSuggestion[]
  changelogSuggestion?: string
}

function detectDocFiles(repoFullName: string, analyses: any[]): {
  readme?: string
  changelog?: string
  docsPaths: string[]
} {
  // Try to get from most recent analysis
  if (analyses && analyses.length > 0) {
    const latest = analyses[0]
    const stats = latest.stats
    if (stats?.docs?.files) {
      const docFiles = stats.docs.files as string[]
      return {
        readme: docFiles.find(f => /^README\.md$/i.test(f.split('/').pop() || '')),
        changelog: docFiles.find(f => /^CHANGELOG\.md$/i.test(f.split('/').pop() || '')),
        docsPaths: docFiles.filter(f => f.startsWith('docs/')),
      }
    }
  }

  // Fallback to common defaults
  return {
    readme: 'README.md',
    changelog: 'CHANGELOG.md',
    docsPaths: [],
  }
}

function analyzePRChanges(
  files: GitHubPRFile[],
  docPaths: { readme?: string; changelog?: string; docsPaths: string[] }
): PRAdviceResult {
  const changedFiles = files.map(f => ({
    path: f.filename,
    status: f.status,
  }))

  const docSuggestions: PRAdviceSuggestion[] = []
  const changedDocFiles = new Set(
    files
      .filter(f => f.filename.endsWith('.md') || f.filename.includes('docs/'))
      .map(f => f.filename)
  )

  // Check for API/routes changes
  const hasAPIRoutesChanges = files.some(
    f => f.filename.includes('/api/') || f.filename.includes('/routes/') || f.filename.includes('/controllers/')
  )
  if (hasAPIRoutesChanges && !changedDocFiles.has('docs/api.md')) {
    docSuggestions.push({
      file: 'docs/api.md',
      reason: 'API routes were modified but API documentation was not updated',
      suggestion: 'Document any new or changed API endpoints',
    })
  }

  // Check for user/auth changes
  const hasUserChanges = files.some(
    f => f.filename.includes('/user/') || f.filename.includes('/auth/') || f.filename.includes('/profile/')
  )
  if (hasUserChanges && docPaths.readme && !changedDocFiles.has(docPaths.readme)) {
    docSuggestions.push({
      file: docPaths.readme,
      reason: 'User-related code was modified',
      suggestion: 'Update the "User features" or "Authentication" section',
    })
  }

  // Check for config/package changes
  const hasConfigChanges = files.some(
    f =>
      f.filename === 'package.json' ||
      f.filename.includes('config') ||
      f.filename === '.env.example' ||
      f.filename === 'docker-compose.yml'
  )
  if (hasConfigChanges && docPaths.readme && !changedDocFiles.has(docPaths.readme)) {
    docSuggestions.push({
      file: docPaths.readme,
      reason: 'Configuration or dependencies were changed',
      suggestion: 'Update the "Setup" or "Configuration" section',
    })
  }

  // Check for library/public API changes
  const hasLibChanges = files.some(
    f => f.filename.includes('/lib/') && f.filename.endsWith('.ts') && !f.filename.endsWith('.test.ts')
  )
  if (hasLibChanges && !changedDocFiles.has('docs/api.md')) {
    docSuggestions.push({
      file: 'docs/api.md',
      reason: 'Library code with public exports was modified',
      suggestion: 'Document any new or changed public functions/classes',
    })
  }

  // Generate changelog suggestion
  const prTitle = files[0] ? files[0].filename : 'changes'
  let changelogSuggestion: string | undefined

  if (hasAPIRoutesChanges || hasUserChanges || hasLibChanges) {
    const newFiles = files.filter(f => f.status === 'added')
    const modifiedFiles = files.filter(f => f.status === 'modified' && f.additions > 0)

    if (newFiles.length > 0 || modifiedFiles.length > 0) {
      changelogSuggestion = '### Added\n- New features added in this PR'
    }
  }

  return {
    changedFiles,
    docSuggestions,
    changelogSuggestion,
  }
}

function generateCommentBody(
  repoFullName: string,
  prNumber: number,
  prTitle: string,
  advice: PRAdviceResult
): string {
  const hasSuggestions = advice.docSuggestions.length > 0 || advice.changelogSuggestion

  let body = `<!-- codekeeper:advice:v1 -->

## 🔎 Codekeeper analysis

**Repo:** \`${repoFullName}\`  
**PR:** #${prNumber} – ${prTitle}

### 1. Code changes I detected

${advice.changedFiles
  .slice(0, 10)
  .map(
    f =>
      `- ${f.status === 'added' ? 'New' : f.status === 'modified' ? 'Modified' : 'Removed'}: \`${f.path}\``
  )
  .join('\n')}
${advice.changedFiles.length > 10 ? `\n*...and ${advice.changedFiles.length - 10} more files*` : ''}
`

  if (hasSuggestions) {
    body += `\n### 2. Docs you may want to update\n\n`

    if (advice.docSuggestions.length > 0) {
      advice.docSuggestions.forEach((suggestion) => {
        body += `- \`${suggestion.file}\` – ${suggestion.reason}.\n`
        if (suggestion.suggestion) {
          body += `  > ${suggestion.suggestion}\n`
        }
      })
    }

    if (advice.changelogSuggestion) {
      body += `\n### 3. Suggested changelog snippet\n\n\`\`\`md\n${advice.changelogSuggestion}\n\`\`\`\n\n`
    }

    body += `\n> 💡 You can edit these suggestions before committing.\n`
  } else {
    body += `\n✅ All relevant documentation files appear to be updated in this PR.\n`
  }

  return body
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

    // Filter out deleted files for analysis
    const changedFiles = files.filter((f) => f.status !== 'removed')

    // 3. Get repo's known doc files from analyses
    const { data: analyses } = await supabase
      .from('repo_analyses')
      .select('stats')
      .eq('user_id', user.id)
      .eq('repo_full_name', repoFullName)
      .order('run_at', { ascending: false })
      .limit(1)

    const docPaths = detectDocFiles(repoFullName, analyses || [])

    // 4. Analyze changes and generate suggestions
    const advice = analyzePRChanges(changedFiles, docPaths)

    // 5. Generate comment body
    const commentBody = generateCommentBody(repoFullName, prNumber, pr.title, advice)

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
            suggestions: advice.docSuggestions,
            changelogSuggestion: advice.changelogSuggestion,
            changedFilesCount: changedFiles.length,
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

