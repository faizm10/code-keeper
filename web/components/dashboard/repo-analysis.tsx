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
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  const repoFullName = `${owner}/${repo}`

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

  useEffect(() => {
    fetchLatestAnalysis()
  }, [owner, repo])

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
      toast.success('Repository analyzed successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to analyze repository')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Analyze Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Repository Analysis</CardTitle>
              <CardDescription>
                Analyze repository structure, documentation, and activity
              </CardDescription>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              variant="default"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Analyze Repo
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Last Analysis</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {formatDate(analysis.run_at)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Documentation */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documentation</p>
                    <p className="text-2xl font-bold">{analysis.stats.docs.count}</p>
                    <p className="text-xs text-muted-foreground">doc files detected</p>
                  </div>
                </div>

                {/* Total Files */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Files</p>
                    <p className="text-2xl font-bold">{analysis.stats.files.total}</p>
                    <p className="text-xs text-muted-foreground">files in repository</p>
                  </div>
                </div>

                {/* Activity */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Default Branch</p>
                    <p className="text-lg font-semibold">{analysis.stats.activity.defaultBranch}</p>
                    {analysis.stats.activity.lastCommitAt && (
                      <p className="text-xs text-muted-foreground">
                        Last commit: {formatDate(analysis.stats.activity.lastCommitAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Files */}
          {analysis.stats.docs.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documentation Files</CardTitle>
                <CardDescription>
                  Detected {analysis.stats.docs.count} documentation file{analysis.stats.docs.count !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.stats.docs.files.slice(0, 20).map((file) => (
                    <div
                      key={file}
                      className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <code className="font-mono text-xs">{file}</code>
                    </div>
                  ))}
                  {analysis.stats.docs.files.length > 20 && (
                    <p className="text-xs text-muted-foreground pt-2">
                      + {analysis.stats.docs.files.length - 20} more files
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Extensions */}
          <Card>
            <CardHeader>
              <CardTitle>Files by Extension</CardTitle>
              <CardDescription>
                Breakdown of file types in the repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analysis.stats.files.byExtension)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 15)
                  .map(([ext, count]) => (
                    <div
                      key={ext}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2"
                    >
                      <span className="font-mono text-sm">
                        {ext || '(no extension)'}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                {Object.keys(analysis.stats.files.byExtension).length > 15 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    + {Object.keys(analysis.stats.files.byExtension).length - 15} more extensions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No analysis yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Analyze Repo" to run your first analysis
              </p>
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Analyze Repo
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

