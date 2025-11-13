import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGitHubAccessToken } from '@/lib/github/auth'
import { RepositoriesList } from '@/components/dashboard/repositories-list'

export const dynamic = 'force-dynamic'

type GitHubRepository = {
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

async function fetchInitialRepositories() {
  try {
    const { token, error } = await getGitHubAccessToken()

    if (error || !token) {
      return { repositories: [], total: 0 }
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    const url = new URL('https://api.github.com/user/repos')
    url.searchParams.set('sort', 'updated')
    url.searchParams.set('direction', 'desc')
    url.searchParams.set('per_page', '30')
    url.searchParams.set('affiliation', 'owner,collaborator,organization_member')

    const response = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      return { repositories: [], total: 0 }
    }

    const repositories = (await response.json()) as GitHubRepository[]

    return {
      repositories,
      total: repositories.length,
    }
  } catch (error) {
    console.error('Error fetching initial repositories:', error)
    return { repositories: [], total: 0 }
  }
}

export default async function RepositoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { repositories, total } = await fetchInitialRepositories()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Repositories</h1>
        <p className="text-muted-foreground">
          Manage and explore your GitHub repositories
        </p>
      </div>

      <RepositoriesList 
        initialRepositories={repositories}
        initialTotal={total}
      />
    </div>
  )
}
