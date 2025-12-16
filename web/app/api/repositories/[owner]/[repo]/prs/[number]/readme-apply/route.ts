import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { createClient } from '@/lib/supabase/server'
import { generateCompleteReadme } from '@/lib/gemini/readme-generator'
import { ReadmeSuggestion } from '@/lib/gemini/readme-suggestions'

export const dynamic = 'force-dynamic'

type GitHubPR = {
  number: number
  title: string
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
 * POST /api/repositories/[owner]/[repo]/prs/[number]/readme-apply
 * 
 * Applies README suggestions by creating/updating README.md file
 * Creates a new branch and commits the changes
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

    // Initialize variables
    let dbRecordId: string | null = null

    // Parse request body
    const body = await request.json()
    const { suggestions, editedContent, action, summary, readmeExists: requestReadmeExists }: {
      suggestions: ReadmeSuggestion[]
      editedContent?: string
      action: 'accept' | 'reject'
      summary?: string
      readmeExists?: boolean
    } = body

    if (action === 'reject') {
      return NextResponse.json({ success: true, message: 'Suggestion rejected' })
    }

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json(
        { error: 'No suggestions provided' },
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

    // 2. Get current README content
    let currentReadme: string | null = null
    let readmeExists = requestReadmeExists ?? false
    try {
      const readmeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/README.md?ref=${pr.base.ref}`,
        { headers, cache: 'no-store' }
      )

      if (readmeResponse.ok) {
        const data = await readmeResponse.json()
        if (data.content && data.encoding === 'base64') {
          currentReadme = Buffer.from(data.content, 'base64').toString('utf-8')
          readmeExists = true
        }
      }
    } catch (error) {
      // README doesn't exist, that's okay
      console.log('README does not exist, will create new one')
      readmeExists = false
    }

    // 3. Generate complete README content
    const finalContent = editedContent || (() => {
      const generated = generateCompleteReadme({
        currentReadme: currentReadme || undefined,
        suggestions,
        prTitle: pr.title,
        prNumber,
      })
      return generated.content
    })()

    // 4. Create a new branch from PR head
    const branchName = `codekeeper-readme-update-${prNumber}-${Date.now()}`
    
    // Get the base commit SHA
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

    // Create new branch
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

    // 5. Create or update README.md file
    const filePath = 'README.md'
    const content = Buffer.from(finalContent).toString('base64')
    const message = `docs: Update README based on PR #${prNumber} suggestions`

    // Check if file exists in the branch
    let fileSha: string | undefined
    try {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`,
        { headers, cache: 'no-store' }
      )

      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        fileSha = fileData.sha
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
          content,
          branch: branchName,
          ...(fileSha ? { sha: fileSha } : {}),
        }),
        cache: 'no-store',
      }
    )

    if (!createFileResponse.ok) {
      const errorText = await createFileResponse.text()
      return NextResponse.json(
        { error: 'Failed to create/update README', details: errorText },
        { status: createFileResponse.status }
      )
    }

    const fileResult = await createFileResponse.json()

    // 6. Build descriptive PR body with structured format
    const newSections = suggestions.filter(s => !s.currentContent)
    const updatedSections = suggestions.filter(s => s.currentContent)
    
    const newFeaturesList = newSections
      .map((s) => {
        const priorityEmoji = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🔵'
        return `- **${s.section}** ${priorityEmoji}: ${s.reason}`
      })
      .join('\n')

    const modificationsList = updatedSections
      .map((s) => {
        const priorityEmoji = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🔵'
        return `- **${s.section}** ${priorityEmoji}: ${s.reason}`
      })
      .join('\n')

    // Build detailed explanations for each suggestion
    const detailedExplanations = suggestions
      .map((s, index) => {
        const priorityEmoji = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🔵'
        const isNew = !s.currentContent
        
        return `### ${index + 1}. ${s.section} ${priorityEmoji} ${s.priority.toUpperCase()} Priority

**Path:** \`README.md\`

**Description:** ${s.reason}

${isNew 
  ? `This is a new section that should be added to the README. The suggested content provides comprehensive documentation for this aspect of the project.`
  : `This section exists in the current README but needs to be updated to reflect recent changes. The current content may be outdated or incomplete, and the suggested update addresses these gaps.`}

**Suggested Content:**
\`\`\`markdown
${s.suggestedContent.slice(0, 500)}${s.suggestedContent.length > 500 ? '\n...' : ''}
\`\`\`

${s.currentContent ? `**Current Content (to be replaced):**
\`\`\`markdown
${s.currentContent.slice(0, 300)}${s.currentContent.length > 300 ? '\n...' : ''}
\`\`\`

` : ''}**Priority Justification:** ${s.priority === 'high' ? 'This update is critical for user understanding or reflects breaking changes.' : s.priority === 'medium' ? 'This update improves documentation clarity and completeness.' : 'This update enhances documentation but is not immediately critical.'}`
      })
      .join('\n\n---\n\n')

    // Build file snapshots
    const fileSnapshots = `**File Path:** \`README.md\`
**Status:** ${readmeExists ? 'modified' : 'added'}
**Change Magnitude:** ${suggestions.length === 1 ? 'minor' : suggestions.length <= 3 ? 'moderate' : 'major'}

${readmeExists 
  ? `This PR updates the existing README.md file with ${suggestions.length} section${suggestions.length > 1 ? 's' : ''} based on AI-generated suggestions from Code Keeper. The changes aim to improve documentation completeness and accuracy.`
  : `This PR creates a new README.md file with comprehensive documentation generated from ${suggestions.length} AI-generated suggestions. The README includes essential project information, setup instructions, and usage guidelines.`}

**Highlights:**
${suggestions.map((s, i) => `- ${s.section}: ${s.reason}`).join('\n')}`

    const prBody = `## Overview

${summary || `This pull request ${readmeExists ? 'updates' : 'creates'} the project's README.md file based on AI-powered suggestions generated by Code Keeper. The suggestions were automatically generated after analyzing PR #${prNumber} and detecting potential documentation gaps or areas for improvement. This aims to proactively help maintain high-quality and up-to-date documentation, especially for new features or significant changes.`}

## Key Changes

${newSections.length > 0 ? `### New Features

${newFeaturesList}
` : ''}${updatedSections.length > 0 ? `### Modifications

${modificationsList}
` : ''}## Detailed Explanation

${detailedExplanations}

## File Snapshots

${fileSnapshots}

---

**Generated by Code Keeper** • Based on suggestions from PR #${prNumber}

> 💡 **Note:** This PR was automatically generated. Please review the changes and adjust as needed before merging.`

    // 7. Create a pull request for the changes
    const prResponse2 = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `📝 Update README based on PR #${prNumber} suggestions`,
          body: prBody,
          head: branchName,
          base: pr.head.ref, // Create PR targeting the same branch as the original PR
        }),
        cache: 'no-store',
      }
    )

    let newPrNumber: number | null = null
    let readmeApplyId: string | null = null
    
    if (prResponse2.ok) {
      const newPr = await prResponse2.json()
      newPrNumber = newPr.number

      // Generate unique ID for tracking (once, before using it)
      readmeApplyId = `readme-${owner}-${repo}-${prNumber}-${Date.now()}`

      // Post a comment on the original PR about the README PR
      const commentBody = `## 📝 README Update PR Created

A pull request has been created to update the README based on AI-generated suggestions:

**PR #${newPrNumber}:** [${pr.title}](https://github.com/${owner}/${repo}/pull/${newPrNumber})

This PR includes ${suggestions.length} suggested ${suggestions.length === 1 ? 'update' : 'updates'} to improve documentation. Once merged, this comment will be updated to reflect the successful merge.

**Tracking ID:** \`${readmeApplyId}\`

---

*Generated by Code Keeper*`

      const commentResponse = await fetch(
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

      if (commentResponse.ok) {
        const comment = await commentResponse.json()
        console.log('Posted README PR comment on original PR', {
          repo: `${owner}/${repo}`,
          original_pr: prNumber,
          readme_pr: newPrNumber,
          readme_apply_id: readmeApplyId,
          comment_id: comment.id,
        })

        // Store the relationship in database for webhook tracking
        try {
          const { data: insertedData, error: insertError } = await supabase
            .from('pr_runs')
            .insert({
              user_id: user.id,
              repo_full_name: `${owner}/${repo}`,
              pr_number: prNumber,
              run_type: 'readme_apply',
              status: 'pending',
              logs: {
                readme_apply_id: readmeApplyId,
                readme_pr_number: newPrNumber,
                readme_branch: branchName,
                suggestions_count: suggestions.length,
                comment_id: comment.id,
                created_at: new Date().toISOString(),
              },
            })
            .select('id')
            .single()

          if (!insertError && insertedData) {
            dbRecordId = insertedData.id
          }
        } catch (dbError) {
          console.error('Failed to store README PR relationship:', dbError)
          // Don't fail the request if DB insert fails
        }
      } else {
        console.warn('Failed to post comment on original PR:', await commentResponse.text())
      }
    }

    return NextResponse.json({
      success: true,
      branch: branchName,
      file: fileResult,
      pullRequestNumber: newPrNumber,
      readmeApplyId: readmeApplyId,
      dbRecordId: dbRecordId || null,
      message: newPrNumber 
        ? `README updated and PR #${newPrNumber} created`
        : 'README updated (PR creation failed)',
    })
  } catch (error) {
    console.error('Error applying README suggestions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to apply README suggestions', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

