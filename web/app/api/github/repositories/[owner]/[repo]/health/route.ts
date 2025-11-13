import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'

export const dynamic = 'force-dynamic'

type GitHubCommit = {
  sha: string
  commit: {
    author: {
      date: string
    }
    message: string
  }
  author: {
    login: string
  } | null
}

type GitHubPullRequest = {
  number: number
  title: string
  state: string
  created_at: string
  updated_at: string
  merged_at: string | null
  closed_at: string | null
}

type GitHubContentItem = {
  name: string
  path: string
  type: 'file' | 'dir'
}

type GitHubFileCommit = {
  commit: {
    author: {
      date: string
    }
  }
}

type RepoHealth = {
  activity: {
    commitsLast30: number
    lastCommitAt: string | null
  }
  pullRequests: {
    openCount: number
    oldestOpenDays: number | null
    oldOpenCount: number
    mergedLast30: number
  }
  docs: {
    files: Array<{
      path: string
      lastUpdatedAt: string
      status: 'fresh' | 'ok' | 'stale'
    }>
  }
  score: number
}

function classifyAge(days: number): 'fresh' | 'ok' | 'stale' {
  if (days < 14) return 'fresh'
  if (days <= 45) return 'ok'
  return 'stale'
}

function daysAgo(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function computeScore(health: Omit<RepoHealth, 'score'>): number {
  let score = 0
  const maxScore = 100

  // Activity score (30 points)
  if (health.activity.commitsLast30 > 0) {
    score += Math.min(30, (health.activity.commitsLast30 / 10) * 10)
  }
  if (health.activity.lastCommitAt) {
    const daysSinceLastCommit = daysAgo(health.activity.lastCommitAt)
    if (daysSinceLastCommit < 7) score += 10
    else if (daysSinceLastCommit < 30) score += 5
  }

  // PR hygiene score (30 points)
  const openPRs = health.pullRequests.openCount
  if (openPRs === 0) score += 10
  else if (openPRs < 5) score += 8
  else if (openPRs < 10) score += 5

  if (health.pullRequests.oldOpenCount === 0) score += 10
  else if (health.pullRequests.oldOpenCount < 3) score += 5

  if (health.pullRequests.mergedLast30 > 0) {
    score += Math.min(10, (health.pullRequests.mergedLast30 / 5) * 5)
  }

  // Documentation score (40 points)
  const docsCount = health.docs.files.length
  if (docsCount === 0) {
    score += 0
  } else {
    const freshDocs = health.docs.files.filter(f => f.status === 'fresh').length
    const okDocs = health.docs.files.filter(f => f.status === 'ok').length
    const staleDocs = health.docs.files.filter(f => f.status === 'stale').length

    score += (freshDocs / docsCount) * 20
    score += (okDocs / docsCount) * 15
    score += (staleDocs / docsCount) * 5
  }

  return Math.round((score / maxScore) * 10 * 10) / 10 // Return 0-10 with 1 decimal
}

export async function GET(
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

    const resolvedParams = await params
    const owner = decodeURIComponent(resolvedParams.owner)
    const repo = decodeURIComponent(resolvedParams.repo)

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    // 1. Get repo info to find default branch
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers, cache: 'no-store' }
    )

    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch repository' },
        { status: repoResponse.status }
      )
    }

    const repoData = await repoResponse.json()
    const defaultBranch = repoData.default_branch

    // 2. Get recent commits
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=50&sha=${defaultBranch}`,
      { headers, cache: 'no-store' }
    )

    let commitsLast30 = 0
    let lastCommitAt: string | null = null

    if (commitsResponse.ok) {
      const commits = (await commitsResponse.json()) as GitHubCommit[]
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      commits.forEach((commit) => {
        const commitDate = new Date(commit.commit.author.date)
        if (commitDate >= thirtyDaysAgo) {
          commitsLast30++
        }
      })

      if (commits.length > 0) {
        lastCommitAt = commits[0].commit.author.date
      }
    }

    // 3. Get open PRs
    const openPRsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=100`,
      { headers, cache: 'no-store' }
    )

    let openCount = 0
    let oldestOpenDays: number | null = null
    let oldOpenCount = 0

    if (openPRsResponse.ok) {
      const openPRs = (await openPRsResponse.json()) as GitHubPullRequest[]
      openCount = openPRs.length

      if (openPRs.length > 0) {
        const oldestPR = openPRs.reduce((oldest, pr) => {
          return new Date(pr.created_at) < new Date(oldest.created_at) ? pr : oldest
        })

        oldestOpenDays = daysAgo(oldestPR.created_at)

        oldOpenCount = openPRs.filter((pr) => {
          return daysAgo(pr.created_at) > 14
        }).length
      }
    }

    // 4. Get merged PRs in last 30 days
    const thirtyDaysAgoISO = new Date()
    thirtyDaysAgoISO.setDate(thirtyDaysAgoISO.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgoISO.toISOString().split('T')[0]

    const mergedPRsResponse = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${repo}+is:pr+is:merged+closed:>=${thirtyDaysAgoStr}`,
      { headers, cache: 'no-store' }
    )

    let mergedLast30 = 0
    if (mergedPRsResponse.ok) {
      const mergedData = await mergedPRsResponse.json()
      mergedLast30 = mergedData.total_count || 0
    }

    // 5. Get documentation files
    const docsFiles: Array<{ path: string; lastUpdatedAt: string; status: 'fresh' | 'ok' | 'stale' }> = []

    // Check root for README.md and CHANGELOG.md
    const rootContentsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents`,
      { headers, cache: 'no-store' }
    )

    if (rootContentsResponse.ok) {
      const rootContents = (await rootContentsResponse.json()) as GitHubContentItem[]
      const docFiles = rootContents.filter(
        (item) => item.type === 'file' && (item.name === 'README.md' || item.name === 'CHANGELOG.md')
      )

      for (const file of docFiles) {
        const commitResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(file.path)}&per_page=1`,
          { headers, cache: 'no-store' }
        )

        if (commitResponse.ok) {
          const commits = (await commitResponse.json()) as GitHubFileCommit[]
          if (commits.length > 0) {
            const lastUpdated = commits[0].commit.author.date
            const days = daysAgo(lastUpdated)
            docsFiles.push({
              path: file.path,
              lastUpdatedAt: lastUpdated,
              status: classifyAge(days),
            })
          }
        }
      }
    }

    // Check docs/ directory
    const docsDirResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/docs`,
      { headers, cache: 'no-store' }
    )

    if (docsDirResponse.ok) {
      const docsContents = (await docsDirResponse.json()) as GitHubContentItem[]
      const docFiles = docsContents.filter((item) => item.type === 'file')

      for (const file of docFiles) {
        const commitResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(file.path)}&per_page=1`,
          { headers, cache: 'no-store' }
        )

        if (commitResponse.ok) {
          const commits = (await commitResponse.json()) as GitHubFileCommit[]
          if (commits.length > 0) {
            const lastUpdated = commits[0].commit.author.date
            const days = daysAgo(lastUpdated)
            docsFiles.push({
              path: file.path,
              lastUpdatedAt: lastUpdated,
              status: classifyAge(days),
            })
          }
        }
      }
    }

    // Build health object
    const health: Omit<RepoHealth, 'score'> = {
      activity: {
        commitsLast30,
        lastCommitAt,
      },
      pullRequests: {
        openCount,
        oldestOpenDays,
        oldOpenCount,
        mergedLast30,
      },
      docs: {
        files: docsFiles,
      },
    }

    const score = computeScore(health)

    return NextResponse.json({ ...health, score })
  } catch (error) {
    console.error('Error fetching repo health:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repository health' },
      { status: 500 }
    )
  }
}

