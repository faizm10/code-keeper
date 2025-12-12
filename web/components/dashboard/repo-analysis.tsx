'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Folder,
  Calendar,
  GitBranch,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type AnalysisStats = {
  docs: {
    files: string[]
    count: number
  }
  files: {
    total: number
    byExtension: Record<string, number>
  }
  activity: {
    defaultBranch: string
    lastCommitAt: string | null
  }
}

type AnalysisRun = {
  id: string
  repo_full_name: string
  run_at: string
  stats: AnalysisStats
}

interface RepoAnalysisProps {
  owner: string
  repo: string
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffInDays = Math.floor(diffInSeconds / 86400)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInDays === 0) return 'today'
  if (diffInDays === 1) return 'yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

function formatExtensionCount(extensions: Record<string, number>, limit: number = 10): string {
  const sorted = Object.entries(extensions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)

  return sorted.map(([ext, count]) => `${count} ${ext || 'no ext'}`).join(', ')
}

export function RepoAnalysis({ owner, repo }: RepoAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const repoFullName = `${owner}/${repo}`

  useEffect(() => {
  const fetchLatestAnalysis = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/analyze/latest`
      )

      if (response.ok) {
        const data = await response.json()
        if (data) {
          setAnalysis(data)
        }
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoading(false)
    }
  }

    fetchLatestAnalysis()
  }, [owner, repo, refreshKey])

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true)
      const response = await fetch(
        `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/analyze`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to analyze repository')
      }

      const data = await response.json()
      setAnalysis(data)
      setRefreshKey(prev => prev + 1) // Trigger refresh
      toast.success('Repository analyzed successfully!', {
        description: `Found ${data.stats.docs.count} documentation files and ${data.stats.files.total.toLocaleString()} total files`,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to analyze repository')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
        </Card>

        {/* Summary Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documentation Files Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* File Extensions Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Analyze Button */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Repository Analysis</CardTitle>
              <CardDescription>
                Scan repository structure, detect documentation files, and analyze codebase statistics
              </CardDescription>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              variant="default"
              className="gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Results */}
      {analysis ? (
        <>
          {/* Summary Card */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription className="mt-1">
                    Scanned repository structure and detected documentation files
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1.5" />
                  {formatDate(analysis.run_at)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Documentation */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <FileText className="h-6 w-6" />
                  </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Documentation
                      </p>
                    <p className="text-2xl font-bold">{analysis.stats.docs.count}</p>
                      <p className="text-xs text-muted-foreground mt-1">doc files detected</p>
                    </div>
                  </div>
                </div>

                {/* Total Files */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Folder className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Total Files
                      </p>
                      <p className="text-2xl font-bold">{analysis.stats.files.total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">files in repository</p>
                  </div>
                  </div>
                </div>

                {/* Activity */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <GitBranch className="h-6 w-6" />
                  </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Default Branch
                      </p>
                      <p className="text-lg font-semibold font-mono">{analysis.stats.activity.defaultBranch}</p>
                    {analysis.stats.activity.lastCommitAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                        Last commit: {formatDate(analysis.stats.activity.lastCommitAt)}
                      </p>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Files */}
          {analysis.stats.docs.files.length > 0 && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documentation Files
                </CardTitle>
                <CardDescription>
                  Detected {analysis.stats.docs.count} documentation file{analysis.stats.docs.count !== 1 ? 's' : ''} in the repository
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {analysis.stats.docs.files.slice(0, 20).map((file) => (
                    <div
                      key={file}
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm hover:border-primary/30 hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <code className="font-mono text-xs truncate flex-1">{file}</code>
                    </div>
                  ))}
                </div>
                {analysis.stats.docs.files.length > 20 && (
                  <p className="text-xs text-muted-foreground pt-3 border-t border-border/60 mt-3">
                    + {analysis.stats.docs.files.length - 20} more documentation files
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* File Extensions */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                Files by Extension
              </CardTitle>
              <CardDescription>
                Breakdown of file types and extensions in the repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(analysis.stats.files.byExtension)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 20)
                  .map(([ext, count]) => (
                    <div
                      key={ext}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 hover:border-primary/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-mono text-sm font-medium">
                        {ext || '(no extension)'}
                      </span>
                      <Badge variant="secondary" className="font-semibold">{count.toLocaleString()}</Badge>
                    </div>
                  ))}
              </div>
              {Object.keys(analysis.stats.files.byExtension).length > 20 && (
                <p className="text-xs text-muted-foreground pt-3 border-t border-border/60 mt-3">
                  + {Object.keys(analysis.stats.files.byExtension).length - 20} more file extensions
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">
                No analysis yet
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Run an analysis to scan the repository structure, detect documentation files, and get insights about your codebase
              </p>
              <Button onClick={handleAnalyze} disabled={analyzing} className="gap-2">
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

