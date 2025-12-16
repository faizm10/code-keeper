'use client'

import { useState } from 'react'
import { FileText, Plus, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CodeBlock } from '@/components/ui/code-block'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type NewDocumentationNeeded = {
  filePath: string
  type: 'readme' | 'docs' | 'changelog' | 'contributing' | 'api'
  reason: string
  priority: 'high' | 'medium' | 'low'
  suggestedStructure?: string[]
}

type DocumentationCreationPromptProps = {
  owner: string
  repo: string
  prNumber: number
  newDocsNeeded: NewDocumentationNeeded[]
  onCreated?: () => void
}

export function DocumentationCreationPrompt({
  owner,
  repo,
  prNumber,
  newDocsNeeded,
  onCreated,
}: DocumentationCreationPromptProps) {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<string | null>(null)

  const toggleDoc = (filePath: string) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath)
    } else {
      newSelected.add(filePath)
    }
    setSelectedDocs(newSelected)
  }

  const handleCreate = async () => {
    if (selectedDocs.size === 0) {
      toast.error('Please select at least one documentation file to create')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(
        `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/${prNumber}/documentation-create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filesToCreate: Array.from(selectedDocs),
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create documentation')
      }

      const result = await response.json()
      
      toast.success(
        `Created ${selectedDocs.size} documentation file${selectedDocs.size > 1 ? 's' : ''}!`,
        {
          description: 'Documentation has been created and committed to the repository.',
          action: result.pullRequestNumber ? {
            label: 'View PR',
            onClick: () => {
              window.open(
                `https://github.com/${owner}/${repo}/pull/${result.pullRequestNumber}`,
                '_blank'
              )
            },
          } : undefined,
        }
      )

      if (onCreated) {
        onCreated()
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create documentation'
      )
    } finally {
      setIsCreating(false)
    }
  }

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    }
    return styles[priority as keyof typeof styles] || styles.low
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'readme':
        return '📝'
      case 'docs':
        return '📚'
      case 'changelog':
        return '📋'
      case 'contributing':
        return '🤝'
      case 'api':
        return '🔌'
      default:
        return '📄'
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary flex-shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl mb-2">
              Documentation Not Found
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This repository doesn't have primary documentation files. Based on the code changes, 
              we suggest creating the following documentation files to help new users get started.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {newDocsNeeded.map((doc) => {
            const isSelected = selectedDocs.has(doc.filePath)
            return (
              <div
                key={doc.filePath}
                className={cn(
                  "rounded-lg border p-4 transition-all cursor-pointer",
                  isSelected
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border/50 bg-background/50 hover:border-border hover:bg-background/80"
                )}
                onClick={() => toggleDoc(doc.filePath)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleDoc(doc.filePath)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(doc.type)}</span>
                      <span className="font-semibold">{doc.filePath}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getPriorityBadge(doc.priority))}
                      >
                        {doc.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{doc.reason}</p>
                    {doc.suggestedStructure && doc.suggestedStructure.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Suggested structure:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {doc.suggestedStructure.map((section, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {selectedDocs.size} of {newDocsNeeded.length} file{newDocsNeeded.length > 1 ? 's' : ''} selected
            </div>
            <Button
              onClick={handleCreate}
              disabled={isCreating || selectedDocs.size === 0}
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Selected Documentation
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

