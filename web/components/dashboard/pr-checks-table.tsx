'use client'

import { useState, useEffect } from 'react'
import { 
  GitPullRequest,
  FileCode,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

type PRCheck = {
  id: string
  repo_full_name: string
  pr_number: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  github_comment_id: number | null
  logs: {
    codeFiles?: string[]
    docFiles?: string[]
    importantCodeChanged?: boolean
    docsChanged?: boolean
    codeFilesCount?: number
    docFilesCount?: number
    comment_posted?: boolean
    skipped?: boolean
  } | null
}

interface PRChecksTableProps {
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

function getStatusBadge(status: PRCheck['status']) {
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
          Pending
        </Badge>
      )
  }
}

export function PRChecksTable({ owner, repo }: PRChecksTableProps) {
  const [checks, setChecks] = useState<PRCheck[]>([])
  const [loading, setLoading] = useState(true)

  const repoFullName = `${owner}/${repo}`

  useEffect(() => {
    async function fetchChecks() {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/runs`
        )

        if (response.ok) {
          const data = await response.json()
          setChecks(data.runs || [])
        }
      } catch (error) {
        console.error('Error fetching PR checks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChecks()
  }, [owner, repo])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header Skeleton */}
            <div className="border-b border-border pb-3">
              <div className="grid grid-cols-7 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
            {/* Table Rows Skeleton */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b border-border/50 pb-3">
                <div className="grid grid-cols-7 gap-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (checks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PR Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitPullRequest className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No PR checks yet
            </p>
            <p className="text-sm text-muted-foreground">
              PR checks will appear here when PRs are analyzed
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PR Checks</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          History of Codekeeper analysis runs for this repository
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">PR</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Code Files</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Doc Files</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Docs Updated?</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Comment?</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">When</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => {
                const codeFilesCount = check.logs?.codeFiles?.length || check.logs?.codeFilesCount || 0
                const docFilesCount = check.logs?.docFiles?.length || check.logs?.docFilesCount || 0
                const docsUpdated = check.logs?.docsChanged || false
                const commentPosted = check.logs?.comment_posted !== false && check.github_comment_id !== null && !check.logs?.skipped

                return (
                  <tr key={check.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${check.pr_number}`}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        <GitPullRequest className="h-4 w-4" />
                        #{check.pr_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FileCode className="h-4 w-4 text-muted-foreground" />
                        {codeFilesCount}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {docFilesCount}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {docsUpdated ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          <XCircle className="mr-1 h-3 w-3" />
                          No
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {commentPosted ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            Yes
                          </Badge>
                          {check.github_comment_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-6 w-6 p-0"
                            >
                              <a
                                href={`https://github.com/${repoFullName}/pull/${check.pr_number}#issuecomment-${check.github_comment_id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          No
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(check.completed_at || check.created_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(check.status)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

