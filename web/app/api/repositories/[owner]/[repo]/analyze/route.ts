import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type GitHubContentItem = {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url?: string
}

type GitHubCommit = {
  commit: {
    author: {
      date: string
    }
    message: string
  }
}

type AnalysisStats = {
  docs: {
    files: string[]
    count: number
  }
  files: {
    total: number
    byExtension: Record<string, number>
  }
  activity: {
    defaultBranch: string
    lastCommitAt: string | null
  }
}

async function getAllFiles(
  owner: string,
  repo: string,
  path: string,
  headers: HeadersInit
): Promise<GitHubContentItem[]> {
  const allFiles: GitHubContentItem[] = []
  const maxDepth = 5 // Prevent infinite recursion

  async function traverse(currentPath: string, depth: number) {
    if (depth > maxDepth) return

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${currentPath}`,
        { headers, cache: 'no-store' }
      )

      if (!response.ok) return

      const contents = (await response.json()) as GitHubContentItem[]
      const items = Array.isArray(contents) ? contents : [contents]

      for (const item of items) {
        if (item.type === 'file') {
          allFiles.push(item)
        } else if (item.type === 'dir') {
          await traverse(item.path, depth + 1)
        }
      }
    } catch (error) {
      console.error(`Error traversing ${currentPath}:`, error)
    }
  }

  await traverse(path, 0)
  return allFiles
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  if (parts.length < 2) return ''
  return `.${parts[parts.length - 1]}`
}

function isDocFile(path: string): boolean {
  const docPatterns = [
    /^README\.md$/i,
    /^CHANGELOG\.md$/i,
    /^docs\/.*\.md$/i,
    /\.md$/i,
  ]
  return docPatterns.some((pattern) => pattern.test(path))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const { token, error } = await getGitHubAccessToken()

    if (error || !token) {
      return NextResponse.json(
        { error: error?.message || 'Missing GitHub access token' },
        { status: 401 }
      )
    }

    // Get authenticated user
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

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    // 1. Get repo info to find default branch
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      cache: 'no-store',
    })

    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch repository' },
        { status: repoResponse.status }
      )
    }

    const repoData = await repoResponse.json()
    const defaultBranch = repoData.default_branch

    // 2. Get recent commits to find last commit date
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1&sha=${defaultBranch}`,
      { headers, cache: 'no-store' }
    )

    let lastCommitAt: string | null = null
    if (commitsResponse.ok) {
      const commits = (await commitsResponse.json()) as GitHubCommit[]
      if (commits.length > 0) {
        lastCommitAt = commits[0].commit.author.date
      }
    }

    // 3. Get all files in the repository
    const allFiles = await getAllFiles(owner, repo, '', headers)

    // 4. Analyze files
    const docFiles: string[] = []
    const fileExtensions: Record<string, number> = {}

    for (const file of allFiles) {
      const ext = getFileExtension(file.name)
      if (ext) {
        fileExtensions[ext] = (fileExtensions[ext] || 0) + 1
      }

      if (isDocFile(file.path)) {
        docFiles.push(file.path)
      }
    }

    // 5. Build stats object
    const stats: AnalysisStats = {
      docs: {
        files: docFiles,
        count: docFiles.length,
      },
      files: {
        total: allFiles.length,
        byExtension: fileExtensions,
      },
      activity: {
        defaultBranch,
        lastCommitAt,
      },
    }

    // 6. Store analysis in database
    const { data: analysis, error: dbError } = await supabase
      .from('repo_analyses')
      .insert({
        user_id: user.id,
        repo_full_name: repoFullName,
        run_at: new Date().toISOString(),
        stats,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Still return the stats even if DB insert fails
    }

    return NextResponse.json({
      id: analysis?.id,
      repo_full_name: repoFullName,
      run_at: new Date().toISOString(),
      stats,
    })
  } catch (error) {
    console.error('Error analyzing repository:', error)
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    )
  }
}

