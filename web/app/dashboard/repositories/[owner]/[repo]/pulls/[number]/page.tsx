import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle,
  GitBranch,
  GitMerge,
  GitPullRequest,
  GitCommit,
  Info,
  FileCode,
  User,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type RouteParams = {
  owner: string
  repo: string
  number: string
}

type GitHubPullRequestDetails = {
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  draft: boolean
  created_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  merged_by: { login: string; avatar_url: string | null } | null
  user: { login: string; avatar_url: string | null; html_url: string }
  base: { ref: string; sha: string }
  head: { ref: string; sha: string }
  requested_reviewers: Array<{ id: number; login: string }>
  additions: number
  deletions: number
  changed_files: number
  commits: number
  labels: Array<{ id: number; name: string; color: string }>
}

type GitHubPullRequestCommit = {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { name: string; date: string } | null
  }
  authored_date?: string
  author: { login: string } | null
}

type GitHubPullRequestFile = {
  sha: string
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  blob_url: string
  raw_url: string
}

type PullRequestData = {
  pullRequest: GitHubPullRequestDetails
  commits: GitHubPullRequestCommit[]
  files: GitHubPullRequestFile[]
}

const MAX_ITEMS = 100

export const dynamic = 'force-dynamic'

export default async function PullRequestDetailsPage({
  params,
}: {
  params: RouteParams | Promise<RouteParams>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const resolvedParams = await params
  const owner = decodeURIComponent(resolvedParams.owner)
  const repo = decodeURIComponent(resolvedParams.repo)
  const number = Number.parseInt(resolvedParams.number, 10)

  if (Number.isNaN(number)) {
    notFound()
  }

  const pullRequestData = await fetchPullRequestDetails(owner, repo, number)

  if (!pullRequestData) {
    notFound()
  }

  const { pullRequest, commits, files } = pullRequestData
  const statusBadge = getStatusBadge(pullRequest)
  const reviewers = pullRequest.requested_reviewers ?? []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Button variant="ghost" asChild className="px-0 text-muted-foreground hover:text-foreground">
              <Link href={`/dashboard/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to repository
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={pullRequest.html_url} target="_blank" rel="noreferrer">
                View on GitHub
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                  {pullRequest.draft && <Badge variant="outline">Draft</Badge>}
                </div>
                <h1 className="mt-3 text-3xl font-bold">
                  #{pullRequest.number} {pullRequest.title}
                </h1>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <Link
                      href={pullRequest.user.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {pullRequest.user.login}
                    </Link>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-4 w-4" />
                    Created {formatDate(pullRequest.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Updated {formatDate(pullRequest.updated_at)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 text-xs">
                {pullRequest.labels.map((label) => (
                  <span
                    key={label.id}
                    className="rounded-full px-2 py-1 font-medium"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={GitBranch}
                label="Branches"
                value={`${pullRequest.head.ref} → ${pullRequest.base.ref}`}
                description={`Head ${pullRequest.head.sha.slice(0, 7)} • Base ${pullRequest.base.sha.slice(0, 7)}`}
              />
              <StatCard
                icon={GitCommit}
                label="Commits"
                value={`${pullRequest.commits}`}
                description={`Showing ${Math.min(commits.length, MAX_ITEMS)} commits`}
              />
              <StatCard
                icon={FileCode}
                label="Files changed"
                value={`${pullRequest.changed_files}`}
                description={`+${pullRequest.additions} / -${pullRequest.deletions}`}
              />
              {pullRequest.merged_at && (
                <StatCard
                  icon={GitMerge}
                  label="Merged"
                  value={formatDate(pullRequest.merged_at)}
                  description={pullRequest.merged_by ? `by ${pullRequest.merged_by.login}` : undefined}
                />
              )}
              {pullRequest.closed_at && !pullRequest.merged_at && (
                <StatCard icon={AlertCircle} label="Closed" value={formatDate(pullRequest.closed_at)} />
              )}
              {reviewers.length > 0 && (
                <StatCard
                  icon={CheckCircle}
                  label="Reviewers"
                  value={reviewers.map((reviewer) => reviewer.login).join(', ')}
                  description="Requested reviewers"
                />
              )}
            </div>

            {pullRequest.body && (
              <div className="mt-8 space-y-4">
                <h2 className="text-lg font-semibold">Description</h2>
                <article className="whitespace-pre-line rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                  {pullRequest.body}
                </article>
              </div>
            )}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Commits</h2>
                </div>
                <Badge variant="outline" className="text-xs">
                  Showing {Math.min(commits.length, MAX_ITEMS)} of {pullRequest.commits}
                </Badge>
              </div>
              {commits.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No commits found for this pull request.
                </div>
              ) : (
                <ul className="space-y-3">
                  {commits.slice(0, MAX_ITEMS).map((commit) => (
                    <li key={commit.sha} className="rounded-md border border-border bg-background/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm">
                            {commit.sha.slice(0, 7)} — {commit.commit.message.split('\n')[0]}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {commit.commit.author?.name ?? commit.author?.login ?? 'Unknown author'} •{' '}
                            {commit.commit.author?.date ? formatDate(commit.commit.author.date) : 'Unknown date'}
                          </p>
                        </div>
                        <Link
                          href={commit.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View commit
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Changed files</h2>
                </div>
                <Badge variant="outline" className="text-xs">
                  Showing {Math.min(files.length, MAX_ITEMS)} of {pullRequest.changed_files}
                </Badge>
              </div>
              {files.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No file changes reported for this pull request.
                </div>
              ) : (
                <ul className="space-y-3">
                  {files.slice(0, MAX_ITEMS).map((file) => (
                    <li key={`${file.sha}-${file.filename}`} className="rounded-md border border-border bg-background/80 p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-sm">{file.filename}</p>
                          <Badge variant="outline" className="text-xs">
                            {file.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          +{file.additions} / -{file.deletions} ({file.changes} changes)
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <Link href={file.blob_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            View file
                          </Link>
                          <Link href={file.raw_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            View raw
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

async function fetchPullRequestDetails(owner: string, repo: string, number: number): Promise<PullRequestData | null> {
  const { token, error } = await getGitHubAccessToken()

  if (error || !token) {
    throw new Error(error?.message ?? 'Unable to authenticate with GitHub')
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const [prResponse, commitsResponse, filesResponse] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, { headers, cache: 'no-store' }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/commits?per_page=${MAX_ITEMS}`, {
      headers,
      cache: 'no-store',
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files?per_page=${MAX_ITEMS}`, {
      headers,
      cache: 'no-store',
    }),
  ])

  if (prResponse.status === 404) {
    return null
  }

  if (!prResponse.ok) {
    throw new Error('Failed to load pull request details from GitHub.')
  }

  const pullRequest = (await prResponse.json()) as GitHubPullRequestDetails

  const commits = commitsResponse.ok
    ? ((await commitsResponse.json()) as GitHubPullRequestCommit[])
    : []

  const files = filesResponse.ok ? ((await filesResponse.json()) as GitHubPullRequestFile[]) : []

  return {
    pullRequest,
    commits,
    files,
  }
}

function getStatusBadge(pullRequest: GitHubPullRequestDetails): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  if (pullRequest.merged_at) {
    return { label: 'Merged', variant: 'secondary' }
  }
  if (pullRequest.state === 'closed') {
    return { label: 'Closed', variant: 'outline' }
  }
  return { label: 'Open', variant: 'default' }
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }
  return date.toLocaleString()
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof GitPullRequest
  label: string
  value: string
  description?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background/70 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}


