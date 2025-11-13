'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  GitPullRequest, 
  FileText, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

interface RepoHealthProps {
  owner: string
  repo: string
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffInDays = Math.floor(diffInSeconds / 86400)

  if (diffInDays === 0) return 'today'
  if (diffInDays === 1) return 'yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

function getStatusBadge(status: 'fresh' | 'ok' | 'stale') {
  switch (status) {
    case 'fresh':
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          Fresh
        </Badge>
      )
    case 'ok':
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          OK
        </Badge>
      )
    case 'stale':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          Stale
        </Badge>
      )
  }
}

function getScoreColor(score: number) {
  if (score >= 8) return 'text-green-500'
  if (score >= 6) return 'text-yellow-500'
  return 'text-red-500'
}

export function RepoHealth({ owner, repo }: RepoHealthProps) {
  const [health, setHealth] = useState<RepoHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHealth() {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/health`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch repository health')
        }

        const data = await response.json()
        setHealth(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load health data')
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
  }, [owner, repo])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !health) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error || 'Failed to load repository health'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Status Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Activity Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{health.activity.commitsLast30}</p>
              <p className="text-sm text-muted-foreground">commits in last 30 days</p>
              {health.activity.lastCommitAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last commit: {formatDate(health.activity.lastCommitAt)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pull Requests Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Pull Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{health.pullRequests.openCount}</p>
              <p className="text-sm text-muted-foreground">open PRs</p>
              {health.pullRequests.oldestOpenDays !== null && (
                <p className="text-xs text-muted-foreground mt-2">
                  Oldest: {health.pullRequests.oldestOpenDays} days
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Merged (30d): {health.pullRequests.mergedLast30}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Documentation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{health.docs.files.length}</p>
              <p className="text-sm text-muted-foreground">doc files detected</p>
              {health.docs.files.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {health.docs.files.filter(f => f.status === 'fresh').length} fresh,{' '}
                  {health.docs.files.filter(f => f.status === 'stale').length} stale
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overall Score Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Repo Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className={cn('text-2xl font-bold', getScoreColor(health.score))}>
                {health.score.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">out of 10</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Health */}
      {health.docs.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentation Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-sm font-semibold">File / Area</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold">Path</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold">Last Updated</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {health.docs.files.map((file) => (
                    <tr key={file.path} className="border-b border-border/50">
                      <td className="py-3 px-3 text-sm">
                        {file.path.split('/').pop()}
                      </td>
                      <td className="py-3 px-3 text-sm font-mono text-muted-foreground">
                        {file.path}
                      </td>
                      <td className="py-3 px-3 text-sm text-muted-foreground">
                        {formatDate(file.lastUpdatedAt)}
                      </td>
                      <td className="py-3 px-3">
                        {getStatusBadge(file.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PR Hygiene */}
      <Card>
        <CardHeader>
          <CardTitle>PR Hygiene</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total open PRs</span>
              <span className="font-semibold">{health.pullRequests.openCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">PRs older than 14 days</span>
              <span className={cn(
                'font-semibold',
                health.pullRequests.oldOpenCount > 0 ? 'text-yellow-500' : 'text-green-500'
              )}>
                {health.pullRequests.oldOpenCount}
              </span>
            </div>
            {health.pullRequests.oldestOpenDays !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Oldest open PR</span>
                <span className="font-semibold text-muted-foreground">
                  {health.pullRequests.oldestOpenDays} days old
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm">Merged PRs (last 30 days)</span>
              <span className="font-semibold text-green-500">
                {health.pullRequests.mergedLast30}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

