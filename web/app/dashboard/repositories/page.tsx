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
  created_at: string
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
  topics?: string[]
  archived?: boolean
  disabled?: boolean
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

    // Transform to match expected format (already in correct format from API)
    const transformedRepos = repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      default_branch: repo.default_branch,
      html_url: repo.html_url,
      pushed_at: repo.pushed_at,
      updated_at: repo.updated_at,
      created_at: repo.created_at,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
        html_url: repo.owner.html_url,
      },
      topics: repo.topics || [],
      archived: repo.archived || false,
      disabled: repo.disabled || false,
    }))

    return {
      repositories: transformedRepos,
      total: transformedRepos.length,
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
