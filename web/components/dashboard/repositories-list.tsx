'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, 
  RefreshCw, 
  Star, 
  GitFork, 
  AlertCircle,
  Calendar,
  Code,
  Lock,
  Globe,
  Loader2,
  Filter,
  X
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

type Repository = {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  html_url: string
  pushed_at: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
  topics: string[]
}

type RepositoriesListProps = {
  initialRepositories?: Repository[]
  initialTotal?: number
}

export function RepositoriesList({ 
  initialRepositories = [], 
  initialTotal = 0 
}: RepositoriesListProps) {
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>(initialRepositories)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'pushed' | 'full_name'>('updated')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<'all' | 'owner' | 'member'>('all')
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchRepositories = async (search?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        sort: sortBy,
        direction: sortDirection,
        type: filterType,
        per_page: '30',
      })

      const query = search !== undefined ? search : debouncedSearch
      if (query) {
        params.set('q', query)
      }

      const response = await fetch(`/api/github/repositories?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch repositories')
      }

      setRepositories(data.repositories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    await fetchRepositories('')
    setSyncing(false)
  }

  // Fetch repositories when sort, filter, or debounced search changes
  useEffect(() => {
    fetchRepositories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDirection, filterType, debouncedSearch])

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

  if (error && error.includes('GitHub access token')) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-destructive">GitHub Not Connected</h3>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
              <Button asChild variant="default" className="mt-4">
                <Link href="/dashboard/settings">
                  Connect GitHub Account
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
              placeholder="Search repositories..."
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
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                All Repositories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('owner')}>
                Owned by Me
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('member')}>
                Member Repositories
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {sortBy === 'updated' ? 'Recently Updated' : sortBy === 'created' ? 'Newest' : sortBy === 'pushed' ? 'Recently Pushed' : 'Name'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('updated')}>
                Recently Updated
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('created')}>
                Newest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('pushed')}>
                Recently Pushed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('full_name')}>
                Name
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}>
                {sortDirection === 'desc' ? 'Descending' : 'Ascending'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing || loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchRepositories()}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !syncing && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Repositories Grid */}
      {!loading && (
        <>
          {repositories.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {debouncedSearch
                      ? 'Try adjusting your search query'
                      : 'Connect your GitHub account to sync repositories'}
                  </p>
                  {!debouncedSearch && (
                    <Button asChild variant="outline">
                      <Link href="/dashboard/settings">Connect GitHub</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/dashboard/repositories/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}`}
                  className="group block"
                >
                  <Card className="h-full transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1 cursor-pointer border-border/60 bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Header with Icon and Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 transition-colors ${
                              repo.private 
                                ? 'bg-destructive/10 text-destructive group-hover:bg-destructive/20' 
                                : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                            }`}>
                              {repo.private ? (
                                <Lock className="h-6 w-6" />
                              ) : (
                                <Globe className="h-6 w-6" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                                {repo.name}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {repo.owner.login}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={repo.private ? 'secondary' : 'outline'} 
                            className="flex-shrink-0 text-xs"
                          >
                            {repo.private ? 'Private' : 'Public'}
                          </Badge>
                        </div>

                        {/* Description */}
                        {repo.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {repo.description}
                          </p>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-xs">
                          {repo.language && (
                            <div className="flex items-center gap-1.5 text-foreground/80">
                              <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                              <span className="font-medium">{repo.language}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Star className="h-4 w-4 fill-yellow-400/80 text-yellow-400/80" />
                            <span className="font-medium">{repo.stargazers_count.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <GitFork className="h-4 w-4" />
                            <span className="font-medium">{repo.forks_count.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Topics */}
                        {repo.topics && repo.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {repo.topics.slice(0, 3).map((topic) => (
                              <Badge
                                key={topic}
                                variant="outline"
                                className="text-xs px-2 py-0.5 bg-muted/30 border-border/50"
                              >
                                {topic}
                              </Badge>
                            ))}
                            {repo.topics.length > 3 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs px-2 py-0.5 bg-muted/30 border-border/50"
                              >
                                +{repo.topics.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Footer with Update Time */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border/60">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Updated {formatDate(repo.pushed_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Results Count */}
          {repositories.length > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Showing {repositories.length} {repositories.length === 1 ? 'repository' : 'repositories'}
              {debouncedSearch && ' matching your search'}
            </div>
          )}
        </>
      )}
    </div>
  )
}

