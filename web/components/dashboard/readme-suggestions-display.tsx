'use client'

import { useState, useEffect } from 'react'
import { FileText, Sparkles, AlertCircle, CheckCircle2, Loader2, RefreshCw, BookOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type ReadmeSuggestion = {
  section: string
  currentContent?: string
  suggestedContent: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

type ReadmeSuggestionsResponse = {
  success: boolean
  suggestions: ReadmeSuggestion[]
  summary: string
  confidence: 'high' | 'medium' | 'low'
  codeFilesCount?: number
  readmeExists?: boolean
  error?: string
}

interface ReadmeSuggestionsDisplayProps {
  owner: string
  repo: string
  prNumber: number
}

export function ReadmeSuggestionsDisplay({ owner, repo, prNumber }: ReadmeSuggestionsDisplayProps) {
  const [suggestions, setSuggestions] = useState<ReadmeSuggestion[]>([])
  const [summary, setSummary] = useState<string>('')
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('low')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const fetchSuggestions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/${prNumber}/readme-suggestions`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch README suggestions')
      }

      const data: ReadmeSuggestionsResponse = await response.json()

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions)
        setSummary(data.summary || '')
        setConfidence(data.confidence || 'low')
        // Expand first suggestion by default
        if (data.suggestions.length > 0) {
          setExpandedSections(new Set([0]))
        }
      } else {
        setError(data.error || 'No suggestions available')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-fetch suggestions when component mounts
    fetchSuggestions()
  }, [owner, repo, prNumber])

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    }
    return styles[priority as keyof typeof styles] || styles.low
  }

  const getConfidenceBadge = (confidence: string) => {
    const styles = {
      high: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      low: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    }
    return styles[confidence as keyof typeof styles] || styles.low
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      case 'low':
        return '🔵'
      default:
        return '⚪'
    }
  }

  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Generating README Suggestions</h3>
              <p className="text-sm text-muted-foreground mt-1">Analyzing code changes and generating suggestions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && suggestions.length === 0) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive flex-shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1">README Suggestions</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchSuggestions} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary flex-shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">README Suggestions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No README updates needed, or suggestions are being generated.
              </p>
              <Button onClick={fetchSuggestions} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary flex-shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl mb-2 flex items-center gap-2">
                README Update Suggestions
              </CardTitle>
              <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={cn("text-xs font-medium px-2.5 py-1 border", getConfidenceBadge(confidence))}
            >
              {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
            </Badge>
            <Button 
              onClick={fetchSuggestions} 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              title="Refresh suggestions"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => {
            const isExpanded = expandedSections.has(index)
            return (
              <div 
                key={index} 
                className={cn(
                  "rounded-xl border overflow-hidden transition-all duration-200",
                  isExpanded 
                    ? "border-primary/30 bg-gradient-to-br from-primary/5 to-background shadow-md" 
                    : "border-border/60 bg-background/50 hover:border-border hover:bg-background/80 hover:shadow-sm"
                )}
              >
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full flex items-center justify-between p-5 transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-semibold text-base">{suggestion.section}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs font-medium px-2.5 py-0.5 border flex items-center gap-1.5",
                            getPriorityBadge(suggestion.priority)
                          )}
                        >
                          <span className="text-xs">{getPriorityIcon(suggestion.priority)}</span>
                          <span className="capitalize">{suggestion.priority} Priority</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 space-y-5 border-t border-border/50 bg-muted/20">
                    {suggestion.currentContent && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-semibold text-foreground">Current Content</h4>
                        </div>
                        <div className="rounded-lg bg-background/80 border border-border/50 p-4 text-sm shadow-sm">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <Markdown content={suggestion.currentContent} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-primary">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">Suggested Update</h4>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/30 p-4 shadow-sm">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <Markdown content={suggestion.suggestedContent} />
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border/50">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Why this update?</p>
                          <p className="text-sm text-foreground leading-relaxed">{suggestion.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

