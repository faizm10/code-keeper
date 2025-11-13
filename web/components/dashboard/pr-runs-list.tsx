'use client'

import { useState, useEffect } from 'react'
import { 
  GitPullRequest,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type PRRun = {
  id: string
  repo_full_name: string
  pr_number: number
  run_type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  started_at: string | null
  completed_at: string | null
  github_comment_id: number | null
  logs: {
    suggestions?: Array<{ file: string; reason: string }>
    changedFilesCount?: number
  } | null
}

interface PRRunsListProps {
  owner: string
  repo: string
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

function getStatusBadge(status: PRRun['status']) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      )
    case 'running':
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Running
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
  }
}

export function PRRunsList({ owner, repo }: PRRunsListProps) {
  const [runs, setRuns] = useState<PRRun[]>([])
  const [loading, setLoading] = useState(true)

  const repoFullName = `${owner}/${repo}`

  useEffect(() => {
    async function fetchRuns() {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/runs`
        )

        if (response.ok) {
          const data = await response.json()
          setRuns(data.runs || [])
        }
      } catch (error) {
        console.error('Error fetching PR runs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRuns()
  }, [owner, repo])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <Skeleton className="h-4 w-32" />
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3].map((j) => (
                            <Skeleton key={j} className="h-5 w-16 rounded-full" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitPullRequest className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No PR runs yet
            </p>
            <p className="text-sm text-muted-foreground">
              PR advice comments will appear here when PRs are analyzed
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">PR Advice Runs</h3>
          <p className="text-sm text-muted-foreground">
            History of Codekeeper comments on pull requests
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {runs.map((run) => (
          <Card key={run.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <GitPullRequest className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          PR #{run.pr_number}
                        </span>
                        {getStatusBadge(run.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(run.created_at)}
                      </p>
                    </div>
                  </div>

                  {run.logs && (
                    <div className="space-y-2 text-sm">
                      {run.logs.changedFilesCount !== undefined && (
                        <p className="text-muted-foreground">
                          Analyzed {run.logs.changedFilesCount} changed file{run.logs.changedFilesCount !== 1 ? 's' : ''}
                        </p>
                      )}
                      {run.logs.suggestions && run.logs.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {run.logs.suggestions.slice(0, 3).map((suggestion, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {suggestion.file}
                            </Badge>
                          ))}
                          {run.logs.suggestions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{run.logs.suggestions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 text-xs"
                    >
                      <a
                        href={`https://github.com/${repoFullName}/pull/${run.pr_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View PR
                      </a>
                    </Button>
                    {run.github_comment_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 text-xs"
                      >
                        <a
                          href={`https://github.com/${repoFullName}/pull/${run.pr_number}#issuecomment-${run.github_comment_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1"
                        >
                          View Comment
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

