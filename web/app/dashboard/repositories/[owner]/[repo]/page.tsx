import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  GitBranch,
  GitFork,
  RefreshCcw,
  Star,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { PullRequestsList } from '@/components/dashboard/pull-requests-list'
import { RepoHealth } from '@/components/dashboard/repo-health'
import { RepoAnalysis } from '@/components/dashboard/repo-analysis'
import { PRRunsList } from '@/components/dashboard/pr-runs-list'
import { PRChecksTable } from '@/components/dashboard/pr-checks-table'
import { AnalyzeRepoButton } from '@/components/dashboard/analyze-repo-button'

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
  pullRequests: Array<{
    id: number
    number: number
    title: string
    state: 'open' | 'closed'
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

const MAX_PULL_REQUEST_PAGES = 5
const PULL_REQUESTS_PER_PAGE = 100


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

  const pullRequests = await fetchAllPullRequests(owner, repo, headers)

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
    pullRequests: pullRequests.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state as 'open' | 'closed',
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

async function fetchAllPullRequests(owner: string, repo: string, headers: HeadersInit): Promise<GitHubPullRequest[]> {
  const allPulls: GitHubPullRequest[] = []

  for (let page = 1; page <= MAX_PULL_REQUEST_PAGES; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=${PULL_REQUESTS_PER_PAGE}&page=${page}`,
      {
        headers,
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      console.error('Failed to load repository pull requests', response.status)
      break
    }

    const pullsPage = (await response.json()) as GitHubPullRequest[]
    allPulls.push(...pullsPage)

    if (pullsPage.length < PULL_REQUESTS_PER_PAGE) {
      break
    }
  }

  return allPulls
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }
  return date.toLocaleString()
}

export const dynamic = 'force-dynamic'

type RepositoryParams = {
  owner: string
  repo: string
}

export default async function RepositoryDetailsPage({
  params,
}: {
  params: Promise<RepositoryParams> | RepositoryParams
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const resolvedParams = await params

  const ownerParam = decodeURIComponent(resolvedParams.owner)
  const repoParam = decodeURIComponent(resolvedParams.repo)

  const owner = ownerParam.startsWith('@') ? ownerParam.slice(1) : ownerParam
  const repo = repoParam.endsWith('.git') ? repoParam.slice(0, -4) : repoParam

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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
        {/* Header Section */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button variant="ghost" asChild className="px-0 text-muted-foreground hover:text-foreground">
                <Link href="/dashboard/repositories">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to repositories
                </Link>
              </Button>
              {repository && (
                <div className="flex flex-wrap gap-2">
              <Badge variant={repository.private ? 'secondary' : 'outline'} className="text-xs">
                    {repository.private ? 'Private' : 'Public'}
                  </Badge>
                  {repository.language && (
                <Badge variant="outline" className="text-xs">{repository.language}</Badge>
                  )}
                </div>
              )}
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
            ) : repository ? (
              <>
                {/* Repository Header Card */}
                <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-6">
                  <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      Repository
                    </p>
                        <h1 className="text-3xl font-bold mb-3">{repository.fullName}</h1>
                  {repository.description && (
                          <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
                            {repository.description}
                          </p>
                  )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Owner:</span>
                          <span>{repository.owner.login}</span>
                        </div>
                        <span className="text-muted-foreground/50">•</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Last push:</span>
                          <span>{formatDate(repository.pushedAt)}</span>
                        </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                        <AnalyzeRepoButton owner={owner} repo={repo} />
                        <Button asChild variant="outline">
                          <a href={repository.htmlUrl} target="_blank" rel="noreferrer">
                        View on GitHub
                          </a>
                    </Button>
                  </div>
                </div>
                  </CardContent>
                </Card>

                {/* Statistics Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map(({ label, value, icon: Icon }) => (
                    <Card
                      key={label}
                      className="border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              {label}
                            </p>
                            <p className="text-2xl font-bold truncate">{value.toLocaleString()}</p>
                        </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="bg-muted/30 border-border/60">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="pulls">Pull Requests</TabsTrigger>
                    <TabsTrigger value="health">Health</TabsTrigger>
                    <TabsTrigger value="analyze">Analyze</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    {!repository ? (
                      <Card className="border-border/60 bg-card/50">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Repository Details Card */}
                        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6">
                            <h2 className="text-lg font-semibold mb-6">Repository Details</h2>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <span className="text-sm text-muted-foreground">Default Branch</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {repository.defaultBranch}
                                </Badge>
                                </div>
                              <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <span className="text-sm text-muted-foreground">Visibility</span>
                                <Badge variant={repository.private ? 'secondary' : 'outline'} className="text-xs">
                                    {repository.private ? 'Private' : 'Public'}
                                  </Badge>
                                </div>
                                {repository.language && (
                                <div className="flex items-center justify-between py-2">
                                  <span className="text-sm text-muted-foreground">Primary Language</span>
                                  <Badge variant="outline" className="text-xs">{repository.language}</Badge>
                                  </div>
                                )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Activity Summary Card */}
                        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                          <CardContent className="pt-6">
                            <h2 className="text-lg font-semibold mb-6">Activity Summary</h2>
                            <div className="space-y-4">
                              <div className="rounded-lg bg-muted/30 p-4 border border-border/50">
                                <p className="text-sm text-muted-foreground mb-2">Pull Requests</p>
                                <p className="text-2xl font-bold">
                                  {pullRequests.length}
                                  <span className="text-base font-normal text-muted-foreground ml-2">
                                    {pullRequests.length === 1 ? 'pull request' : 'pull requests'}
                                  </span>
                                </p>
                              </div>
                              <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Open PRs</span>
                                  <span className="font-semibold">
                                    {pullRequests.filter(pr => pr.state === 'open').length}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Merged PRs</span>
                                  <span className="font-semibold">
                                    {pullRequests.filter(pr => pr.mergedAt).length}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Closed PRs</span>
                                  <span className="font-semibold">
                                    {pullRequests.filter(pr => pr.state === 'closed' && !pr.mergedAt).length}
                                  </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pulls">
                    <PullRequestsList
                      owner={owner}
                      repo={repo}
                      pullRequests={pullRequests}
                    />
                  </TabsContent>

                  <TabsContent value="health">
                    <RepoHealth owner={owner} repo={repo} />
                  </TabsContent>

                  <TabsContent value="analyze">
                    <RepoAnalysis owner={owner} repo={repo} />
                  </TabsContent>
                       </Tabs>

                       {/* PR Checks Table */}
                       <div className="mt-8">
                         <PRChecksTable owner={owner} repo={repo} />
                       </div>
                     </>
                   ) : null}
                 </div>
           </div>
         )
       }



