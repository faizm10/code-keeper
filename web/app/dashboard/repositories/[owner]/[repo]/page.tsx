import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  GitBranch,
  GitPullRequest,
  GitFork,
  Layers,
  RefreshCcw,
  Star,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardFooter } from '@/components/dashboard/dashboard-footer'
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

type GitHubTreeNode = {
  path: string
  type: 'blob' | 'tree' | 'commit'
  size?: number
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

type RepositoryDetailsResponse = {
  repository: {
    name: string
    fullName: string
    description: string | null
    private: boolean
    language: string | null
    stars: number
    forks: number
    openIssues: number
    defaultBranch: string
    htmlUrl: string
    pushedAt: string
    owner: {
      login: string
      avatarUrl: string
    }
  }
  tree: {
    truncated: boolean
    totalCount: number
    entries: GitHubTreeNode[]
  }
  pullRequests: Array<{
    id: number
    number: number
    title: string
    state: string
    draft: boolean
    mergedAt: string | null
    createdAt: string
    updatedAt: string
    htmlUrl: string
    author: {
      login: string
      avatarUrl: string
      profileUrl: string
    }
  }>
}

const MAX_TREE_ENTRIES = 200

class GitHubAuthError extends Error {}

async function fetchRepositoryDetails(owner: string, repo: string): Promise<RepositoryDetailsResponse | null> {
  const { token, error } = await getGitHubAccessToken()

  if (error || !token) {
    throw new GitHubAuthError(error?.message ?? 'Missing GitHub access token. Please reconnect your GitHub account.')
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    cache: 'no-store',
  })

  if (repoResponse.status === 404) {
    return null
  }

  if (repoResponse.status === 401) {
    throw new GitHubAuthError('GitHub authentication failed. Please reconnect your GitHub account.')
  }

  if (!repoResponse.ok) {
    throw new Error('Failed to load repository data from GitHub.')
  }

  const repoData = (await repoResponse.json()) as GitHubRepoDetails

  const [treeResponse, pullsResponse] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(repoData.default_branch)}?recursive=1`, {
      headers,
      cache: 'no-store',
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=20`, {
      headers,
      cache: 'no-store',
    }),
  ])

  let treeEntries: GitHubTreeNode[] = []
  let treeTruncated = false

  if (treeResponse.ok) {
    const treeData = await treeResponse.json()
    const entries = (treeData?.tree ?? []) as GitHubTreeNode[]
    treeTruncated = Boolean(treeData?.truncated) || entries.length > MAX_TREE_ENTRIES
    treeEntries = entries.slice(0, MAX_TREE_ENTRIES)
  }

  let pullRequests: GitHubPullRequest[] = []
  if (pullsResponse.ok) {
    pullRequests = (await pullsResponse.json()) as GitHubPullRequest[]
  }

  return {
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
      owner: {
        login: repoData.owner.login,
        avatarUrl: repoData.owner.avatar_url,
      },
    },
    tree: {
      truncated: treeTruncated,
      totalCount: treeEntries.length,
      entries: treeEntries,
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
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }
  return date.toLocaleString()
}

export const dynamic = 'force-dynamic'

export default async function RepositoryDetailsPage({
  params,
}: {
  params: { owner: string; repo: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const owner = decodeURIComponent(params.owner)
  const repo = decodeURIComponent(params.repo)

  let repositoryDetails: RepositoryDetailsResponse | null = null
  let errorMessage: string | null = null

  try {
    repositoryDetails = await fetchRepositoryDetails(owner, repo)
  } catch (error) {
    if (error instanceof GitHubAuthError) {
      redirect('/dashboard?githubReconnect=1')
    }
    errorMessage =
      error instanceof Error
        ? error.message
        : 'Something went wrong while loading the repository from GitHub.'
  }

  if (!repositoryDetails && !errorMessage) {
    errorMessage = 'We could not find this repository or you do not have access to it.'
  }

  const repository = repositoryDetails?.repository
  const tree = repositoryDetails?.tree
  const pullRequests = repositoryDetails?.pullRequests ?? []

  const stats = repository
    ? [
        {
          label: 'Stars',
          value: repository.stars,
          icon: Star,
        },
        {
          label: 'Forks',
          value: repository.forks,
          icon: GitFork,
        },
        {
          label: 'Open issues',
          value: repository.openIssues,
          icon: RefreshCcw,
        },
        {
          label: 'Default branch',
          value: repository.defaultBranch,
          icon: GitBranch,
        },
      ]
    : []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button variant="ghost" asChild className="px-0 text-muted-foreground hover:text-foreground">
                <Link href="/dashboard/repositories">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to repositories
                </Link>
              </Button>
              <div className="flex flex-wrap gap-2">
                <Badge variant={repository.private ? 'secondary' : 'outline'}>
                  {repository.private ? 'Private' : 'Public'}
                </Badge>
                {repository.language && (
                  <Badge variant="outline">{repository.language}</Badge>
                )}
              </div>
            </div>

            {errorMessage ? (
              <div className="space-y-6 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
                <div className="flex items-start gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 flex-none" />
                  <div className="space-y-2">
                    <p className="font-medium text-destructive">
                      Unable to load repository details
                    </p>
                    <p className="text-destructive/80">
                      {errorMessage}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" asChild size="sm">
                        <Link href="/dashboard">Back to dashboard</Link>
                      </Button>
                      <Button variant="outline" asChild size="sm">
                        <Link href="https://github.com/apps" target="_blank" rel="noreferrer">
                          Check GitHub access
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : repository && tree ? (
              <>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">
                      Repository
                    </p>
                    <h1 className="text-3xl font-bold">{repository.fullName}</h1>
                  </div>
                  {repository.description && (
                    <p className="text-lg text-muted-foreground">{repository.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>Last push {formatDate(repository.pushedAt)}</span>
                    <span>•</span>
                    <span>Owner: {repository.owner.login}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href={repository.htmlUrl} target="_blank" rel="noreferrer">
                        View on GitHub
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-xl font-semibold">{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Repository structure</h2>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Showing {Math.min(tree.entries.length, 25)} of {tree.totalCount}{' '}
                        {tree.truncated && '(truncated)'}
                      </span>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30">
                      <ul className="divide-y divide-border text-sm font-mono">
                        {tree.entries.slice(0, 25).map((node) => (
                          <li key={node.path} className="px-4 py-2">
                            <span className="mr-2">{node.type === 'tree' ? '📁' : '📄'}</span>
                            {node.path}
                            {typeof node.size === 'number' && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({node.size} B)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Pull requests</h2>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Latest {Math.min(pullRequests.length, 10)}
                      </span>
                    </div>
                    {pullRequests.length === 0 ? (
                      <div className="rounded-md border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                        No pull requests found for this repository yet.
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {pullRequests.slice(0, 10).map((pr) => (
                          <li
                            key={pr.id}
                            className="rounded-md border border-border bg-background/80 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold">
                                #{pr.number} {pr.title}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {pr.state.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Created {formatDate(pr.createdAt)} by {pr.author.login}
                              {pr.mergedAt && ` • merged ${formatDate(pr.mergedAt)}`}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs">
                              <Link
                                href={pr.htmlUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                              >
                                View on GitHub
                              </Link>
                              <span className="text-muted-foreground">
                                Updated {formatDate(pr.updatedAt)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Need more detail?</p>
                      <p className="text-sm text-muted-foreground">
                        We only show a subset of the file tree and the 20 most recent pull requests.
                        For full insights, open the repository on GitHub or adjust this view in future releases.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <DashboardFooter className="mt-0" />
    </div>
  )
}


