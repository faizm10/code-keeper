'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  CheckCircle2,
  FolderTree,
  GitPullRequest,
  Loader2,
  RefreshCcw,
} from 'lucide-react'

type OnboardingStatus = 'initializing' | 'needs-auth' | 'select' | 'preview' | 'completed'

type RepositorySummary = {
  id: number
  name: string
  fullName: string
  description: string | null
  private: boolean
  language: string | null
  stars: number
  htmlUrl: string
  owner: {
    login: string
    avatarUrl: string
  }
  updatedAt: string
}

type RepositoryDetails = {
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
      avatar_url: string
    }
  }
  tree: {
    truncated: boolean
    totalCount: number
    entries: Array<{
      path: string
      type: 'blob' | 'tree' | 'commit'
      size: number | null
    }>
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

const LOCAL_STORAGE_KEY = 'ck:repo-onboarding-status'

const statusToStep: Record<Exclude<OnboardingStatus, 'initializing'>, number> = {
  'needs-auth': 1,
  select: 2,
  preview: 3,
  completed: 3,
}

const statusToTitle: Record<Exclude<OnboardingStatus, 'initializing'>, string> = {
  'needs-auth': 'Connect your GitHub account',
  select: 'Choose a repository to sync',
  preview: 'Review repository data',
  completed: 'Repository connected',
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }
  return date.toLocaleString()
}

export function RepositoryOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus>('initializing')
  const [repositories, setRepositories] = useState<RepositorySummary[]>([])
  const [selectedRepository, setSelectedRepository] = useState<RepositorySummary | null>(null)
  const [details, setDetails] = useState<RepositoryDetails | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const loadRepositories = useCallback(async () => {
    setIsLoadingRepos(true)
    setError(null)

    try {
      const response = await fetch('/api/github/repositories', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (response.status === 401) {
        setStatus('needs-auth')
        setRepositories([])
        return
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to load repositories')
      }

      const data = (await response.json()) as { repositories: RepositorySummary[] }
      setRepositories(data.repositories)
      if (data.repositories.length === 0) {
        setStatus('select')
        setError('No repositories found for your GitHub account.')
      } else {
        setStatus('select')
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('needs-auth')
    } finally {
      setIsLoadingRepos(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedStatus = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (storedStatus === 'completed') {
      setStatus('completed')
      return
    }

    loadRepositories().catch((error) => {
      console.error('Failed to load repositories', error)
    })
  }, [loadRepositories])

  const handleConnectGitHub = useCallback(async () => {
    setIsLoadingRepos(true)
    setError(null)
    try {
      const supabase = createClient()
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectUrl = `${siteUrl}/auth/callback?next=/dashboard`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          scopes: 'repo read:user read:org user:email',
        },
      })

      if (error) {
        throw error
      }
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect with GitHub. Please try again.',
      )
      setIsLoadingRepos(false)
    }
  }, [])

  const fetchRepositoryDetails = useCallback(async (repo: RepositorySummary) => {
    setIsLoadingDetails(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/github/repositories/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(
          repo.name,
        )}`,
        {
          credentials: 'include',
          cache: 'no-store',
        },
      )

      if (response.status === 401) {
        setStatus('needs-auth')
        throw new Error('GitHub authentication expired. Please reconnect your account.')
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to load repository details')
      }

      const data = (await response.json()) as RepositoryDetails
      setDetails(data)
      setStatus('preview')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unable to load repository details.')
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  const handleSelectRepository = useCallback(
    (repo: RepositorySummary) => {
      setSelectedRepository(repo)
      fetchRepositoryDetails(repo).catch((error) =>
        console.error('Failed to fetch repository details', error),
      )
    },
    [fetchRepositoryDetails],
  )

  const handleCompleteOnboarding = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, 'completed')
    }
    setStatus('completed')
  }, [])

  const handleResetOnboarding = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
    setDetails(null)
    setSelectedRepository(null)
    setStatus('initializing')
    loadRepositories().catch((error) => {
      console.error('Failed to reload repositories', error)
    })
  }, [loadRepositories])

  const filteredRepositories = useMemo(() => {
    if (!search.trim()) {
      return repositories
    }
    const query = search.toLowerCase()
    return repositories.filter((repo) => {
      const haystack = `${repo.name} ${repo.fullName} ${repo.description ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [repositories, search])

  const currentStep = status === 'initializing' ? 1 : statusToStep[status]
  const currentTitle = status === 'initializing' ? 'Checking your setup' : statusToTitle[status]

  return (
    <Card className="mb-10 border-dashed">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Step {currentStep} of 3
            </Badge>
            <CardTitle className="text-xl sm:text-2xl">Repository Onboarding</CardTitle>
          </div>
          {status === 'completed' ? (
            <Badge className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-sm">
              {currentTitle}
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect a GitHub repository so Code Keeper can index your files, structure, and pull
          requests for deeper insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-none" />
            <div className="space-y-2">
              <p>{error}</p>
              {status === 'needs-auth' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleConnectGitHub}
                  disabled={isLoadingRepos}
                >
                  {isLoadingRepos ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    'Reconnect GitHub'
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {status === 'initializing' && (
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking your GitHub connection…</span>
          </div>
        )}

        {status === 'needs-auth' && (
          <div className="flex flex-col gap-4 rounded-md border border-border bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">
              You&apos;ll be redirected to GitHub to grant Code Keeper access to your repositories.
              We request read-only permissions to fetch repository metadata, file structures, and
              pull requests.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleConnectGitHub} disabled={isLoadingRepos}>
                {isLoadingRepos ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  'Connect GitHub'
                )}
              </Button>
              <Button variant="outline" onClick={loadRepositories} disabled={isLoadingRepos}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                I already connected
              </Button>
            </div>
          </div>
        )}

        {status === 'select' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Select the repository you want Code Keeper to index first. You can add more later
                from the repositories section.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadRepositories} disabled={isLoadingRepos}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
            <input
              type="search"
              placeholder="Search repositories by name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="grid gap-3">
              {isLoadingRepos && (
                <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading repositories…</span>
                </div>
              )}
              {!isLoadingRepos && filteredRepositories.length === 0 && (
                <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No repositories match your search. Try another query or refresh from GitHub.
                </div>
              )}
              {filteredRepositories.map((repo) => (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => handleSelectRepository(repo)}
                  className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{repo.fullName}</p>
                      {repo.private ? (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Private
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {repo.language && <span>{repo.language}</span>}
                      <span>•</span>
                      <span>⭐ {repo.stars}</span>
                      <span>•</span>
                      <span>Updated {formatDate(repo.updatedAt)}</span>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-sm text-muted-foreground">{repo.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {status === 'preview' && details && selectedRepository && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{details.repository.fullName}</p>
                {details.repository.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {details.repository.description}
                  </p>
                )}
              </div>
              <Link href={details.repository.htmlUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  View on GitHub
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FolderTree className="h-4 w-4" />
                  Repository Structure
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Showing {Math.min(details.tree.entries.length, 12)} of {details.tree.totalCount}{' '}
                  items {details.tree.truncated && '(truncated)'}
                </p>
                <ul className="mt-3 space-y-2 text-sm font-mono">
                  {details.tree.entries.slice(0, 12).map((node) => (
                    <li key={node.path} className="truncate">
                      {node.type === 'tree' ? '📁' : '📄'} {node.path}
                      {typeof node.size === 'number' && (
                        <span className="text-muted-foreground"> ({node.size} B)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <GitPullRequest className="h-4 w-4" />
                  Pull Requests
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Latest {Math.min(details.pullRequests.length, 5)} pull requests from GitHub
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {details.pullRequests.slice(0, 5).map((pr) => (
                    <li key={pr.id} className="rounded border border-border/70 bg-background/60 p-3">
                      <p className="font-medium">
                        #{pr.number} {pr.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pr.state.toUpperCase()} • Opened {formatDate(pr.createdAt)} by{' '}
                        {pr.author.login}
                      </p>
                      <Link
                        href={pr.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs text-primary hover:underline"
                      >
                        View on GitHub
                      </Link>
                    </li>
                  ))}
                  {details.pullRequests.length === 0 && (
                    <li className="rounded border border-border/70 bg-background/60 p-3 text-xs text-muted-foreground">
                      No pull requests found for this repository yet.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCompleteOnboarding} disabled={isLoadingDetails}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete setup
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDetails(null)
                  setSelectedRepository(null)
                  setStatus('select')
                }}
                disabled={isLoadingDetails}
              >
                Choose another repository
              </Button>
            </div>
          </div>
        )}

        {status === 'completed' && details && selectedRepository && (
          <div className="space-y-4 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">
                {details.repository.fullName} is now connected. We&apos;ll keep its structure and
                pull requests in sync.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Repository</p>
                <p className="font-medium">{details.repository.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  Last push {formatDate(details.repository.pushedAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Default branch</p>
                <p className="font-medium">{details.repository.defaultBranch}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={details.repository.htmlUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">
                  View repository
                </Button>
              </Link>
              <Button size="sm" variant="outline" onClick={handleResetOnboarding}>
                Reset onboarding
              </Button>
            </div>
          </div>
        )}

        {(isLoadingDetails && status !== 'preview') && (
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading repository details…</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


