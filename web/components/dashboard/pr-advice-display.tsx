'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageSquare, CheckCircle2, AlertCircle, Loader2, ExternalLink, Copy, Check, GitCommit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type PRAdvice = {
  id: string
  repo_full_name: string
  pr_number: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  github_comment_id: number | null
  logs: {
    suggestions?: Array<{ file: string; reason: string }>
    changelogSuggestion?: string
    changedFilesCount?: number
  } | null
}

interface PRAdviceDisplayProps {
  owner: string
  repo: string
  prNumber: number
  initialHeadSha?: string
  initialCommits?: number
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

function generateAdviceMarkdown(advice: PRAdvice): string {
  const { logs } = advice
  if (!logs) return ''

  const parts: string[] = []
  
  parts.push('## 🔎 Codekeeper analysis\n')
  
  if (logs.changedFilesCount !== undefined) {
    parts.push(`**Files analyzed:** ${logs.changedFilesCount} changed file${logs.changedFilesCount !== 1 ? 's' : ''}\n`)
  }

  if (logs.suggestions && logs.suggestions.length > 0) {
    parts.push('\n### 📝 Docs to consider updating\n')
    logs.suggestions.forEach((suggestion) => {
      parts.push(`- **${suggestion.file}** - ${suggestion.reason}`)
    })
  }

  if (logs.changelogSuggestion) {
    parts.push('\n### 📋 Suggested changelog entry\n')
    parts.push('```md')
    parts.push(logs.changelogSuggestion)
    parts.push('```')
    parts.push('\n> You can edit this suggestion before committing.')
  }

  return parts.join('\n')
}

export function PRAdviceDisplay({ owner, repo, prNumber, initialHeadSha, initialCommits }: PRAdviceDisplayProps) {
  const [advice, setAdvice] = useState<PRAdvice | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasNewCommits, setHasNewCommits] = useState(false)
  
  // Track current PR state
  const currentHeadShaRef = useRef<string | undefined>(initialHeadSha)
  const currentCommitsRef = useRef<number | undefined>(initialCommits)

  const repoFullName = `${owner}/${repo}`

  const fetchAdvice = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      const response = await fetch(
        `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/${prNumber}/advice/latest`
      )

      if (response.ok) {
        const data = await response.json()
        setAdvice(data.advice)
      }
    } catch (error) {
      console.error('Error fetching PR advice:', error)
    } finally {
      if (!silent) {
        setLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }, [owner, repo, prNumber])

  const checkForNewCommits = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${prNumber}/check`
      )

      if (response.ok) {
        const data = await response.json()
        const newHeadSha = data.head_sha
        const newCommits = data.commits

        // Check if head SHA changed (new commits)
        if (newHeadSha && currentHeadShaRef.current && newHeadSha !== currentHeadShaRef.current) {
          setHasNewCommits(true)
          currentHeadShaRef.current = newHeadSha
          currentCommitsRef.current = newCommits
          
          // Silently refresh advice
          await fetchAdvice(true)
          
          // Clear the indicator after a few seconds
          setTimeout(() => {
            setHasNewCommits(false)
          }, 5000)
        } else if (!currentHeadShaRef.current) {
          // Initialize refs on first check
          currentHeadShaRef.current = newHeadSha
          currentCommitsRef.current = newCommits
        }
      }
    } catch (error) {
      console.error('Error checking for new commits:', error)
    }
  }, [owner, repo, prNumber, fetchAdvice])

  useEffect(() => {
    fetchAdvice()
  }, [fetchAdvice])

  // Poll for updates every 5 seconds if no advice yet
  useEffect(() => {
    if (advice) return // Stop polling once we have advice
    
    const interval = setInterval(() => {
      fetchAdvice()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [advice, fetchAdvice])

  // Check for new commits every 30 seconds
  useEffect(() => {
    if (!advice) return // Only check if we already have advice

    const interval = setInterval(() => {
      checkForNewCommits()
    }, 30000) // Check every 30 seconds

    // Also check immediately after advice is loaded
    checkForNewCommits()

    return () => clearInterval(interval)
  }, [advice, checkForNewCommits])

  const handleCopy = async () => {
    if (!advice) return
    
    const markdown = generateAdviceMarkdown(advice)
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    toast.success('Advice copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !advice) {
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

  if (!advice) {
    return null
  }

  const markdown = generateAdviceMarkdown(advice)

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Codekeeper Advice</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated {formatDate(advice.completed_at || advice.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasNewCommits && (
              <Badge 
                variant="outline" 
                className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse"
              >
                <GitCommit className="mr-1 h-3 w-3" />
                New commits detected
              </Badge>
            )}
            {isRefreshing && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Updating...
              </Badge>
            )}
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Completed
            </Badge>
            {advice.github_comment_id && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs"
              >
                <a
                  href={`https://github.com/${repoFullName}/pull/${prNumber}#issuecomment-${advice.github_comment_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on GitHub
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <Markdown content={markdown} />
        </div>

        {advice.logs && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs"
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  Copy Markdown
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchAdvice(false)}
              className="h-8 text-xs"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <Loader2 className="mr-1 h-3 w-3" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

