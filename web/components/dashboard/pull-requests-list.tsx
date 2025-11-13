'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  GitPullRequest, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle,
  GitMerge,
  ExternalLink,
  Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type PullRequestSummary = {
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
}

interface PullRequestsListProps {
  owner: string
  repo: string
  pullRequests: PullRequestSummary[]
  loading?: boolean
}

type FilterType = 'all' | 'open' | 'closed'

export function PullRequestsList({ owner, repo, pullRequests, loading = false }: PullRequestsListProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats and Filters Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        {/* Pull Requests Cards Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header Skeleton */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Skeleton className="h-5 w-5 rounded mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-6 w-3/4" />
                        </div>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>

                  {/* Actions Skeleton */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const filteredPRs = useMemo(() => {
    if (filter === 'all') return pullRequests
    return pullRequests.filter(pr => pr.state === filter)
  }, [pullRequests, filter])

  const stats = useMemo(() => {
    const open = pullRequests.filter(pr => pr.state === 'open').length
    const closed = pullRequests.filter(pr => pr.state === 'closed').length
    return { open, closed, total: pullRequests.length }
  }, [pullRequests])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString()
  }

  const getStateIcon = (pr: PullRequestSummary) => {
    if (pr.mergedAt) {
      return <GitMerge className="h-4 w-4 text-purple-500" />
    }
    if (pr.state === 'open') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStateBadge = (pr: PullRequestSummary) => {
    if (pr.mergedAt) {
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
          Merged
        </Badge>
      )
    }
    if (pr.state === 'open') {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          Open
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
        Closed
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {stats.total} {stats.total === 1 ? 'pull request' : 'pull requests'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              {stats.open} open
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              {stats.closed} closed
            </span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            All ({stats.total})
          </Button>
          <Button
            variant={filter === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('open')}
            className="text-xs"
          >
            Open ({stats.open})
          </Button>
          <Button
            variant={filter === 'closed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('closed')}
            className="text-xs"
          >
            Closed ({stats.closed})
          </Button>
        </div>
      </div>

      {/* Pull Requests List */}
      {filteredPRs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitPullRequest className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No {filter === 'all' ? '' : filter} pull requests found
              </p>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' 
                  ? 'This repository doesn\'t have any pull requests yet.'
                  : `No ${filter} pull requests in this repository.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPRs.map((pr) => (
            <Card 
              key={pr.id} 
              className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">
                        {getStateIcon(pr)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/dashboard/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pr.number}`}
                            className="font-semibold text-base hover:text-primary transition-colors line-clamp-1"
                          >
                            {pr.draft && (
                              <Badge variant="secondary" className="mr-2 text-xs">
                                Draft
                              </Badge>
                            )}
                            #{pr.number} {pr.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {pr.author.login}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created {formatDate(pr.createdAt)}
                          </span>
                          {pr.updatedAt !== pr.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Updated {formatDate(pr.updatedAt)}
                            </span>
                          )}
                          {pr.mergedAt && (
                            <span className="flex items-center gap-1 text-purple-500">
                              <GitMerge className="h-3 w-3" />
                              Merged {formatDate(pr.mergedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStateBadge(pr)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 text-xs"
                    >
                      <Link
                        href={`/dashboard/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pr.number}`}
                      >
                        View details
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 text-xs"
                    >
                      <Link
                        href={pr.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View on GitHub
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

