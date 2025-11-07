import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'

type GitHubRepoDetails = {
  name: string
  full_name: string
  private: boolean
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  html_url: string
  pushed_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

type GitHubTreeResponse = {
  sha: string
  truncated: boolean
  tree: Array<{
    path: string
    type: 'blob' | 'tree' | 'commit'
    size?: number
    sha: string
    url: string
    mode: string
  }>
}

type GitHubPullRequest = {
  id: number
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  updated_at: string
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  draft: boolean
  merged_at: string | null
}

const MAX_TREE_ENTRIES = 200
const headersForToken = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

export async function GET(
  _request: Request,
  { params }: { params: { owner: string; repo: string } },
) {
  const owner = decodeURIComponent(params.owner)
  const repo = decodeURIComponent(params.repo)

  try {
    const { token, error } = await getGitHubAccessToken()

    if (error || !token) {
      return NextResponse.json(
        { error: error?.message ?? 'Unable to authenticate with GitHub' },
        { status: error?.message === 'Unauthenticated' ? 401 : 400 },
      )
    }

    const headers = headersForToken(token)

    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      cache: 'no-store',
    })

    if (repoResponse.status === 401) {
      return NextResponse.json(
        { error: 'GitHub authentication failed. Please reconnect your GitHub account.' },
        { status: 401 },
      )
    }

    if (repoResponse.status === 404) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (!repoResponse.ok) {
      const body = await repoResponse.json().catch(() => ({}))
      console.error('GitHub repo error', repoResponse.status, body)
      return NextResponse.json({ error: 'Failed to load repository data' }, { status: 502 })
    }

    const repoData = (await repoResponse.json()) as GitHubRepoDetails

    const [treeResponse, pullsResponse] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(
          repoData.default_branch,
        )}?recursive=1`,
        {
          headers,
          cache: 'no-store',
        },
      ),
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=20`,
        {
          headers,
          cache: 'no-store',
        },
      ),
    ])

    let treeEntries: GitHubTreeResponse['tree'] = []
    let isTreeTruncated = false

    if (treeResponse.ok) {
      const treeData = (await treeResponse.json()) as GitHubTreeResponse
      isTreeTruncated = treeData.truncated || treeData.tree.length > MAX_TREE_ENTRIES
      treeEntries = treeData.tree.slice(0, MAX_TREE_ENTRIES)
    } else {
      console.error('Failed to load repository tree', treeResponse.status)
    }

    let pullRequests: GitHubPullRequest[] = []
    if (pullsResponse.ok) {
      pullRequests = (await pullsResponse.json()) as GitHubPullRequest[]
    } else {
      console.error('Failed to load repository pull requests', pullsResponse.status)
    }

    return NextResponse.json({
      repository: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        private: repoData.private,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        defaultBranch: repoData.default_branch,
        htmlUrl: repoData.html_url,
        pushedAt: repoData.pushed_at,
        owner: repoData.owner,
      },
      tree: {
        truncated: isTreeTruncated,
        totalCount: treeEntries.length,
        entries: treeEntries.map((node) => ({
          path: node.path,
          type: node.type,
          size: node.size ?? null,
        })),
      },
      pullRequests: pullRequests.map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        draft: pr.draft,
        mergedAt: pr.merged_at,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        htmlUrl: pr.html_url,
        author: {
          login: pr.user.login,
          avatarUrl: pr.user.avatar_url,
          profileUrl: pr.user.html_url,
        },
      })),
    })
  } catch (error) {
    console.error('Unexpected error fetching repository details', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}


