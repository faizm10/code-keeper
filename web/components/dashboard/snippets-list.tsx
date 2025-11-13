'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  Plus, 
  Tag, 
  Code, 
  Calendar,
  Copy,
  Trash2,
  Edit,
  X,
  Filter,
  FileCode,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SnippetModal } from './snippet-modal'

export type Snippet = {
  id: string
  title: string
  description?: string
  code: string
  language: string
  tags: string[]
  category?: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'ck:snippets'
const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'c',
  'html', 'css', 'scss', 'json', 'yaml', 'markdown', 'sql', 'bash', 'shell',
  'php', 'ruby', 'swift', 'kotlin', 'dart', 'other'
]

export function SnippetsList() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load snippets from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          setSnippets(JSON.parse(stored))
        } catch (error) {
          console.error('Failed to load snippets:', error)
        }
      }
    }
  }, [])

  // Save snippets to localStorage
  const saveSnippets = (newSnippets: Snippet[]) => {
    setSnippets(newSnippets)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSnippets))
    }
  }

  const handleCreate = () => {
    setEditingSnippet(null)
    setIsModalOpen(true)
  }

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      saveSnippets(snippets.filter(s => s.id !== id))
    }
  }

  const handleSave = (snippetData: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSnippet) {
      // Update existing
      const updated = snippets.map(s => 
        s.id === editingSnippet.id 
          ? { ...snippetData, id: s.id, createdAt: s.createdAt, updatedAt: new Date().toISOString() }
          : s
      )
      saveSnippets(updated)
    } else {
      // Create new
      const newSnippet: Snippet = {
        ...snippetData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      saveSnippets([...snippets, newSnippet])
    }
    setIsModalOpen(false)
    setEditingSnippet(null)
  }

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Get all unique tags and categories
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    snippets.forEach(s => s.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags).sort()
  }, [snippets])

  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    snippets.forEach(s => {
      if (s.category) categories.add(s.category)
    })
    return Array.from(categories).sort()
  }, [snippets])

  // Filter snippets
  const filteredSnippets = useMemo(() => {
    return snippets.filter(snippet => {
      const matchesSearch = !searchQuery || 
        snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snippet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snippet.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesLanguage = !selectedLanguage || snippet.language === selectedLanguage
      const matchesTag = !selectedTag || snippet.tags.includes(selectedTag)
      const matchesCategory = !selectedCategory || snippet.category === selectedCategory

      return matchesSearch && matchesLanguage && matchesTag && matchesCategory
    })
  }, [snippets, searchQuery, selectedLanguage, selectedTag, selectedCategory])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      typescript: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      python: 'bg-green-500/20 text-green-600 dark:text-green-400',
      java: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
      html: 'bg-red-500/20 text-red-600 dark:text-red-400',
      css: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      json: 'bg-pink-500/20 text-pink-600 dark:text-pink-400',
      sql: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    }
    return colors[language] || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedLanguage(null)}>
                All Languages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {LANGUAGES.slice(0, 10).map(lang => (
                <DropdownMenuItem 
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                >
                  {lang}
                </DropdownMenuItem>
              ))}
              {allCategories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Category</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {allCategories.map(cat => (
                    <DropdownMenuItem 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Snippet
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedLanguage || selectedTag || selectedCategory) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedLanguage && (
            <Badge variant="secondary" className="gap-1">
              Language: {selectedLanguage}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedLanguage(null)}
              />
            </Badge>
          )}
          {selectedTag && (
            <Badge variant="secondary" className="gap-1">
              Tag: {selectedTag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedTag(null)}
              />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              Category: {selectedCategory}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedCategory(null)}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Tags Cloud */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Tags:</span>
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              <Tag className="mr-1 h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Snippets Grid */}
      {filteredSnippets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {snippets.length === 0 ? 'No snippets yet' : 'No snippets found'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {snippets.length === 0
                  ? 'Create your first code snippet to get started'
                  : 'Try adjusting your search or filters'}
              </p>
              {snippets.length === 0 && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Snippet
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSnippets.map((snippet) => (
            <Card 
              key={snippet.id} 
              className="group hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-primary transition-colors">
                        {snippet.title}
                      </h3>
                      {snippet.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {snippet.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(snippet)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(snippet.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Code Preview */}
                  <div className="relative">
                    <div className="rounded-lg bg-muted/50 border border-border p-4 overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getLanguageColor(snippet.language)}`}
                        >
                          <Code className="mr-1 h-3 w-3" />
                          {snippet.language}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleCopy(snippet.code, snippet.id)}
                        >
                          {copiedId === snippet.id ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1 h-3 w-3" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="text-xs font-mono overflow-x-auto text-foreground/80">
                        <code>{snippet.code.slice(0, 200)}{snippet.code.length > 200 ? '...' : ''}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Tags */}
                  {snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {snippet.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        >
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Updated {formatDate(snippet.updatedAt)}</span>
                    </div>
                    {snippet.category && (
                      <Badge variant="secondary" className="text-xs">
                        {snippet.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredSnippets.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredSnippets.length} of {snippets.length} {snippets.length === 1 ? 'snippet' : 'snippets'}
        </div>
      )}

      {/* Create/Edit Modal */}
      <SnippetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingSnippet(null)
        }}
        onSave={handleSave}
        snippet={editingSnippet}
        languages={LANGUAGES}
      />
    </div>
  )
}

