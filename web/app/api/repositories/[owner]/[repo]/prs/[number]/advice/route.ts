import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { createClient } from '@/lib/supabase/server'
import {
  analyzePullRequestWithGemini,
  GeminiPRAnalysis,
  PRFileForGemini,
} from '@/lib/gemini/pr-advice'
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

type ChangedFileEntry = {
  path: string
  status: 'added' | 'modified' | 'removed' | 'renamed'
}

type PRAdviceResult = {
  codeFiles: string[]
  docFiles: string[]
  importantCodeChanged: boolean
  docsChanged: boolean
  docSuggestions: PRAdviceSuggestion[]
  allFiles: ChangedFileEntry[]
}

const COMMENT_MARKER = '<!-- codekeeper:advice:v2 -->'

function formatFileList(files: ChangedFileEntry[]) {
  const added = files.filter((f) => f.status === 'added')
  const modified = files.filter((f) => f.status === 'modified')
  const removed = files.filter((f) => f.status === 'removed')
  const renamed = files.filter((f) => f.status === 'renamed')

  let list = ''

  if (added.length > 0) {
    list += `\n### Added\n${added.map((f) => `- \`${f.path}\``).join('\n')}\n`
  }

  if (modified.length > 0) {
    list += `\n### Modified\n${modified.map((f) => `- \`${f.path}\``).join('\n')}\n`
  }

  if (removed.length > 0) {
    list += `\n### Removed\n${removed.map((f) => `- \`${f.path}\``).join('\n')}\n`
  }

  if (renamed.length > 0) {
    list += `\n### Renamed\n${renamed.map((f) => `- \`${f.path}\``).join('\n')}\n`
  }

  return list
}

type GeminiFileSummary = GeminiPRAnalysis['fileSummaries'][number]

type FileChangeAnalysis = {
  description: string
  additions: string[]
  deletions: string[]
}

function isPackageLockFile(path: string) {
  return /package-lock\.json$/i.test(path)
}

function summarizePackageLockChanges(file: GitHubPRFile): string {
  const addedVersions = (file.patch?.match(/^\+\s+"version":\s*"[^"]+"/gm) ?? []).length
  const removedVersions = (file.patch?.match(/^-\s+"version":\s*"[^"]+"/gm) ?? []).length
  const bumped = Math.min(addedVersions, removedVersions)
  const addedOnly = Math.max(0, addedVersions - bumped)
  const removedOnly = Math.max(0, removedVersions - bumped)

  const statusLabel =
    file.status === 'added'
      ? 'New'
      : file.status === 'modified'
      ? 'Updated'
      : file.status === 'removed'
      ? 'Deleted'
      : 'Renamed'

  return `**${statusLabel}**: \`${file.filename}\` — package changes (added ${addedOnly}, updated ${bumped}, removed ${removedOnly})`
}

function extractMeaningfulChanges(patch?: string): FileChangeAnalysis {
  if (!patch) {
    return { description: '', additions: [], deletions: [] }
  }

  const additions: string[] = []
  const deletions: string[] = []

  const lines = patch.split('\n')
  for (const line of lines) {
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
      continue
    }

    if (line.startsWith('+') && line.trim() !== '+') {
      const content = line.slice(1).trim()
      if (
        content &&
        !content.startsWith('//') &&
        !content.startsWith('#') &&
        !content.startsWith('*')
      ) {
        additions.push(content)
      }
    } else if (line.startsWith('-') && line.trim() !== '-') {
      const content = line.slice(1).trim()
      if (
        content &&
        !content.startsWith('//') &&
        !content.startsWith('#') &&
        !content.startsWith('*')
      ) {
        deletions.push(content)
      }
    }
  }

  const description = generateChangeDescription(additions, deletions, patch)
  return { description, additions, deletions }
}

function generateChangeDescription(
  additions: string[],
  deletions: string[],
  fullPatch: string
): string {
  const patterns = {
    newFunction: /^\s*(function|const|let|var)\s+(\w+)\s*[=(]/,
    newClass: /^\s*class\s+(\w+)/,
    newImport: /^\s*import\s+.*from/,
    newExport: /^\s*export\s+(function|const|class|default)/,
    newType: /^\s*(type|interface)\s+(\w+)/,
    configChange: /^\s*["']?\w+["']?\s*:/,
    testCase: /^\s*(it|test|describe)\s*\(/,
  }

  for (const addition of additions.slice(0, 3)) {
    if (patterns.newFunction.test(addition)) {
      const match = addition.match(patterns.newFunction)
      return `Added ${match?.[1] === 'function' ? 'function' : 'method'} \`${match?.[2]}\``
    }
    if (patterns.newClass.test(addition)) {
      const match = addition.match(patterns.newClass)
      return `Added class \`${match?.[1]}\``
    }
    if (patterns.newImport.test(addition)) {
    const match = addition.match(/import\s+(.*)\s+from\s+['"](.*)['"]/)
    if (match) {
      return `Imported ${match[1]} from ${match[2]}`
    }
    return 'Added import'
    }
    if (patterns.newExport.test(addition)) {
      return 'Added exports'
    }
    if (patterns.newType.test(addition)) {
      const match = addition.match(patterns.newType)
      return `Added ${match?.[1]} \`${match?.[2]}\``
    }
    if (patterns.testCase.test(addition)) {
      return 'Added test cases'
    }
    if (patterns.configChange.test(addition)) {
      return 'Updated configuration'
    }
  }

  if (additions.length && deletions.length) {
    return 'Modified implementation'
  }
  if (additions.length) {
    const snippet = additions.slice(0, 2).join(' | ')
    return `Added code: ${snippet}`
  }
  if (deletions.length) {
    return 'Removed code'
  }
  if (fullPatch.includes('Binary file')) {
    return 'Updated binary content'
  }
  return ''
}

function getChangeMagnitude(additions: number, deletions: number): string {
  const total = additions + deletions
  if (total === 0) return ''
  if (total < 10) return 'minor change'
  if (total < 50) return 'moderate change'
  if (total < 200) return 'significant change'
  return 'major refactor'
}

function buildImprovedFileSummary(file: GitHubPRFile): GeminiFileSummary {
  if (isPackageLockFile(file.filename)) {
    return {
      path: file.filename,
      status: file.status,
      summary: summarizePackageLockChanges(file),
    }
  }

  const analysis = extractMeaningfulChanges(file.patch)
  const parts: string[] = []

  // Status + file
  const statusLabel =
    file.status === 'added'
      ? 'New'
      : file.status === 'modified'
      ? 'Updated'
      : file.status === 'removed'
      ? 'Deleted'
      : 'Renamed'
  parts.push(`**${statusLabel}**: \`${file.filename}\``)

  // Magnitude if meaningful
  if (file.status !== 'removed') {
    const magnitude = getChangeMagnitude(file.additions, file.deletions)
    if (magnitude) {
      parts.push(`(${magnitude})`)
    }
  }

  // Added code → describe what it does in simple words
  if (analysis.description && analysis.description.startsWith('Added code:')) {
    parts.push(
      `— ${
        file.additions + file.deletions > 50
          ? 'Introduces new logic. Highlights: '
          : ''
      }${analysis.description.replace('Added code: ', '')}`
    )
  } else if (analysis.description) {
    parts.push(`— ${analysis.description}`)
  } else if (analysis.additions.length) {
    const snippet =
      analysis.additions.length > 1
        ? analysis.additions.slice(0, 2).join(' | ')
        : analysis.additions[0]
    parts.push(`— ${snippet}`)
  } else if (file.patch && file.patch.includes('Binary file')) {
    parts.push('— binary content updated')
  }

  return {
    path: file.filename,
    status: file.status,
    summary: parts.join(' '),
  }
}

function buildFallbackFileSummaries(files: GitHubPRFile[]): GeminiFileSummary[] {
  return files.map((file) => buildImprovedFileSummary(file))
}

function renderFileSummariesSection(summaries: GeminiFileSummary[]) {
  if (!summaries.length) {
    return ''
  }

  const lines = summaries.map(
    (summary) => `- ${summary.summary || `${summary.status?.toUpperCase()} \`${summary.path}\``}`
  )

  return `\n\n### File snapshots\n${lines.join('\n')}`
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

  // Case 1: Code + Docs changed → positive comment (optional, can be shorter)
  if (advice.importantCodeChanged && advice.docsChanged) {
    // Short, friendly comment - or you can return null to skip commenting
    return `${COMMENT_MARKER}

## 👋 Codekeeper

I see you updated docs along with your code changes 👍 Nothing else from me.

### Files changed

${formatFileList(advice.allFiles)}
`
  }
  
  // Case 2: Code changed but no docs → suggest updating docs
  if (advice.importantCodeChanged && !advice.docsChanged) {
    let body = `${COMMENT_MARKER}

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
    const expectedFileSummaryCount = files.length
    let effectiveFileSummaries: GeminiFileSummary[] = buildFallbackFileSummaries(files)

    // 3. Analyze changes using simple classification (fallback + logging)
    const advice = analyzePRChanges(files)
    const docFilesFromDiff = files
      .filter((file) => classifyFile(file.filename) === 'docs')
      .map((file) => file.filename)

    // 4. Ask Gemini for event + doc obligation analysis
    const filesForGemini: PRFileForGemini[] = files.map((file) => ({
      path: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
    }))

    let geminiAnalysis: GeminiPRAnalysis | null = null
    try {
      geminiAnalysis = await analyzePullRequestWithGemini({
        prTitle: pr.title,
        prNumber,
        prBody: pr.body ?? '',
        files: filesForGemini,
        docFilesTouched: docFilesFromDiff,
      })
      if (geminiAnalysis) {
        const llmSummaries = geminiAnalysis.fileSummaries ?? []
        if (
          llmSummaries.length === expectedFileSummaryCount &&
          llmSummaries.every((summary) => summary?.path)
        ) {
          effectiveFileSummaries = llmSummaries
        } else {
          console.warn(
            'Gemini file summaries missing or mismatched. Falling back to heuristic summaries.',
            {
              repo: repoFullName,
              pr_number: prNumber,
              expected: expectedFileSummaryCount,
              received: llmSummaries.length,
            }
          )
        }

        console.log('Gemini analysis result', {
          repo: repoFullName,
          pr_number: prNumber,
          zones: geminiAnalysis.zones,
          events: geminiAnalysis.events,
          obligations: geminiAnalysis.obligations,
          docsTouched: geminiAnalysis.docsTouched,
          missingDocs: geminiAnalysis.missingDocs,
          shouldWarn: geminiAnalysis.shouldWarn,
          confidence: geminiAnalysis.confidence,
          fileSummariesCount: geminiAnalysis.fileSummaries?.length ?? 0,
        })
        console.log('Gemini file summaries', effectiveFileSummaries)
        console.log('Gemini comment preview', geminiAnalysis.comment)
      }
    } catch (geminiError) {
      console.error('Gemini analysis failed:', geminiError)
      effectiveFileSummaries = buildFallbackFileSummaries(files)
    }

    // 5. Generate the final comment using Gemini when available
    let commentBody: string | null = null
    let skipReason = 'Docs-only PR, no comment posted'

    if (geminiAnalysis) {
      const llmComment = geminiAnalysis.comment?.trim()
      if (llmComment) {
        commentBody = `${COMMENT_MARKER}\n\n${llmComment}${renderFileSummariesSection(
          effectiveFileSummaries
        )}`
      } else if (geminiAnalysis.shouldWarn || geminiAnalysis.events.length > 0) {
        // Gemini spotted events but failed to return a comment; fall back to heuristics
        console.warn('Gemini returned events but no comment. Falling back to heuristic template.', {
          repo: repoFullName,
          pr_number: prNumber,
        })
        const fallback = generateCommentBody(repoFullName, prNumber, pr.title, advice)
        commentBody = fallback
          ? `${fallback}${renderFileSummariesSection(effectiveFileSummaries)}`
          : null
      } else {
        skipReason =
          geminiAnalysis.reasoning || 'Gemini analysis determined docs already cover this change'
      }
    } else {
      const fallbackComment = generateCommentBody(repoFullName, prNumber, pr.title, advice)
      commentBody = fallbackComment
        ? `${fallbackComment}${renderFileSummariesSection(effectiveFileSummaries)}`
        : null
      if (!commentBody) {
        skipReason = 'Docs-only PR, no comment posted'
      }
    }

    if (!commentBody && effectiveFileSummaries.length) {
      commentBody = `${COMMENT_MARKER}

## 👋 Codekeeper

Here’s a quick snapshot of this PR.
${renderFileSummariesSection(effectiveFileSummaries)}
`
      skipReason = ''
    }

    // If comment body is still null (e.g., docs-only PR with no files), skip posting
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
            codeFilesCount: advice.codeFiles.length,
            docFilesCount: advice.docFiles.length,
            importantCodeChanged: advice.importantCodeChanged,
            docsChanged: advice.docsChanged,
            comment_posted: false,
            skipped: true,
              reason: skipReason,
              llmAnalysis: geminiAnalysis,
              fileSummaries: effectiveFileSummaries,
          },
          })
          .eq('id', prRunId)
      }
      return NextResponse.json({
        success: true,
        run_id: prRunId,
        skipped: true,
        reason: skipReason,
        advice,
        llm_analysis: geminiAnalysis,
        file_summaries: effectiveFileSummaries,
      })
    }

    // 6. Always create a fresh comment to avoid overwriting previous context
    let commentId: number | null = null
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
      console.log('Posted new Codekeeper comment', { repo: repoFullName, pr_number: prNumber, commentId })
    } else {
      const errorBody = await createResponse.text()
      console.error('Failed to post Codekeeper comment', {
        repo: repoFullName,
        pr_number: prNumber,
        status: createResponse.status,
        statusText: createResponse.statusText,
        body: errorBody?.slice(0, 500),
      })
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
            codeFilesCount: advice.codeFiles.length,
            docFilesCount: advice.docFiles.length,
            importantCodeChanged: advice.importantCodeChanged,
            docsChanged: advice.docsChanged,
            suggestions: advice.docSuggestions,
            changedFilesCount: advice.allFiles.length,
            comment_posted: commentId !== null,
            fullCommentBody: commentBody, // Store the full comment body
            llmAnalysis: geminiAnalysis,
            llmUsed: geminiAnalysis !== null,
            fileSummaries: effectiveFileSummaries,
          },
        })
        .eq('id', prRunId)
    }

    return NextResponse.json({
      success: true,
      run_id: prRunId,
      comment_id: commentId,
      advice,
      llm_analysis: geminiAnalysis,
      file_summaries: effectiveFileSummaries,
    })
  } catch (error) {
    console.error('Error processing PR advice:', error)
    return NextResponse.json(
      { error: 'Failed to process PR advice' },
      { status: 500 }
    )
  }
}

