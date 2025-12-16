'use client'

import { useState, useEffect } from 'react'
import { FileText, Sparkles, AlertCircle, CheckCircle2, Loader2, RefreshCw, BookOpen, Check, X, Edit2, Eye, GitPullRequest } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { CodeBlock } from '@/components/ui/code-block'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateCompleteReadme } from '@/lib/gemini/readme-generator'
import { toast } from 'sonner'
import { DocumentationCreationPrompt } from './documentation-creation-prompt'

type ReadmeSuggestion = {
  section: string
  currentContent?: string
  suggestedContent: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

type ReadmeAppliedStatus = {
  id: string | null
  status: string
  readmePrNumber: number | null
  completedAt: string | null
  merged: boolean
}

type NewDocumentationNeeded = {
  filePath: string
  type: 'readme' | 'docs' | 'changelog' | 'contributing' | 'api'
  reason: string
  priority: 'high' | 'medium' | 'low'
  suggestedStructure?: string[]
}

type ReadmeSuggestionsResponse = {
  success: boolean
  suggestions: ReadmeSuggestion[]
  summary: string
  confidence: 'high' | 'medium' | 'low'
  codeFilesCount?: number
  readmeExists?: boolean
  currentReadme?: string
  appliedStatus?: ReadmeAppliedStatus | null
  needsDocumentation?: boolean
  changeAnalysis?: {
    newDocsNeeded: NewDocumentationNeeded[]
    changesSummary: string
  } | null
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
  const [currentReadme, setCurrentReadme] = useState<string | null>(null)
  const [readmeExists, setReadmeExists] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<string>('')
  const [previewMode, setPreviewMode] = useState<'preview' | 'edit'>('preview')
  const [applying, setApplying] = useState(false)
  const [appliedStatus, setAppliedStatus] = useState<ReadmeAppliedStatus | null>(null)
  const [newDocsNeeded, setNewDocsNeeded] = useState<NewDocumentationNeeded[]>([])
  const [showCreationPrompt, setShowCreationPrompt] = useState(false)

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

      if (data.success) {
        // Check if documentation needs to be created
        if (data.needsDocumentation && data.changeAnalysis?.newDocsNeeded && data.changeAnalysis.newDocsNeeded.length > 0) {
          // Show creation prompt instead of suggestions
          setNewDocsNeeded(data.changeAnalysis.newDocsNeeded)
          setShowCreationPrompt(true)
          setSuggestions([])
          setSummary(data.changeAnalysis.changesSummary || 'No documentation found. Please create documentation files.')
          setConfidence(data.confidence || 'low')
          setCurrentReadme(null)
          setReadmeExists(false)
          setAppliedStatus(null)
          setEditedContent('')
        } else if (data.suggestions && data.suggestions.length > 0) {
          setShowCreationPrompt(false)
          setNewDocsNeeded([])
          setSuggestions(data.suggestions)
          setSummary(data.summary || '')
          setConfidence(data.confidence || 'low')
          setCurrentReadme(data.currentReadme || null)
          setReadmeExists(data.readmeExists || false)
          setAppliedStatus(data.appliedStatus || null)
          
          // Generate complete README from suggestions
          const generated = generateCompleteReadme({
            currentReadme: data.currentReadme,
            suggestions: data.suggestions,
            prTitle: `PR #${prNumber}`,
            prNumber,
          })
          setEditedContent(generated.content)
          
          // Expand first suggestion by default
          setExpandedSections(new Set([0]))
        } else {
          setError(data.error || 'No suggestions available')
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

  const handleApply = async (action: 'accept' | 'reject') => {
    if (action === 'reject') {
      toast.info('Suggestion rejected')
      return
    }

    setApplying(true)
    try {
      const response = await fetch(
        `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/${prNumber}/readme-apply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            suggestions,
            editedContent: previewMode === 'edit' ? editedContent : undefined,
            action: 'accept',
            summary,
            readmeExists,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to apply README changes')
      }

      const result = await response.json()
      
      if (result.pullRequestNumber) {
        toast.success(
          `README updated! PR #${result.pullRequestNumber} created`,
          {
            description: 'You can review and merge the changes.',
            action: {
              label: 'View PR',
              onClick: () => {
                window.open(
                  `https://github.com/${owner}/${repo}/pull/${result.pullRequestNumber}`,
                  '_blank'
                )
              },
            },
          }
        )
        
        // Update applied status
        setAppliedStatus({
          id: result.readmeApplyId || null,
          status: 'pending',
          readmePrNumber: result.pullRequestNumber,
          completedAt: null,
          merged: false,
        })
        
        // Refresh suggestions to get updated status
        setTimeout(() => {
          fetchSuggestions()
        }, 1000)
      } else {
        toast.success('README updated successfully')
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to apply README changes'
      )
    } finally {
      setApplying(false)
    }
  }

  const generatedReadme = editedContent || (suggestions.length > 0 
    ? generateCompleteReadme({
        currentReadme: currentReadme || undefined,
        suggestions,
        prTitle: `PR #${prNumber}`,
        prNumber,
      }).content
    : '')

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

  // Show creation prompt if no docs exist and we have suggestions for new docs
  if (showCreationPrompt && newDocsNeeded.length > 0) {
    return (
      <DocumentationCreationPrompt
        owner={owner}
        repo={repo}
        prNumber={prNumber}
        newDocsNeeded={newDocsNeeded}
        onCreated={() => {
          setShowCreationPrompt(false)
          // Refresh to get new suggestions after docs are created
          setTimeout(() => {
            fetchSuggestions()
          }, 2000)
        }}
      />
    )
  }

  if (suggestions.length === 0 && !showCreationPrompt) {
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
                {appliedStatus?.merged && (
                  <Badge 
                    variant="outline" 
                    className="ml-2 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Applied
                  </Badge>
                )}
                {appliedStatus && !appliedStatus.merged && (
                  <Badge 
                    variant="outline" 
                    className="ml-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
                  >
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Pending
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
              {appliedStatus?.readmePrNumber && (
                <div className="mt-2">
                  <a
                    href={`https://github.com/${owner}/${repo}/pull/${appliedStatus.readmePrNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <GitPullRequest className="h-3 w-3" />
                    View README PR #{appliedStatus.readmePrNumber}
                    {appliedStatus.merged && ' (Merged)'}
                  </a>
                </div>
              )}
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
        {/* Complete README Preview/Edit Section */}
        {suggestions.length > 0 && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-background p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {readmeExists ? 'Updated README' : 'New README'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {readmeExists 
                      ? 'Preview the complete README with all suggestions applied'
                      : 'Complete README generated from suggestions'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={previewMode === 'preview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('preview')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant={previewMode === 'edit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setPreviewMode('edit')
                    setIsEditing(true)
                  }}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>

            {previewMode === 'preview' ? (
              <div className="rounded-lg border border-border/50 bg-background/50 overflow-hidden">
                <CodeBlock
                  language="markdown"
                  filename="README.md"
                  code={generatedReadme}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Edit the README content..."
                />
                <p className="text-xs text-muted-foreground">
                  Make any edits you'd like before applying the changes
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => handleApply('reject')}
                disabled={applying}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => handleApply('accept')}
                disabled={applying || !generatedReadme}
              >
                {applying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Accept & Apply
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

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

