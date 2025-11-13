import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'

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
  topics: string[]
  archived: boolean
  disabled: boolean
}

export async function GET(request: Request) {
  try {
    const { token, error } = await getGitHubAccessToken()

    if (error || !token) {
      return NextResponse.json(
        { error: error?.message || 'Missing GitHub access token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '30')
    const type = searchParams.get('type') || 'all' // all, owner, member
    const sort = searchParams.get('sort') || 'updated' // created, updated, pushed, full_name
    const direction = searchParams.get('direction') || 'desc' // asc, desc
    const q = searchParams.get('q') || ''

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    // If there's a search query, use the search API
    if (q) {
      // Get authenticated user's login
      const userResponse = await fetch('https://api.github.com/user', {
        headers,
        cache: 'no-store',
      })

      if (!userResponse.ok) {
        const error = await userResponse.text()
        return NextResponse.json(
          { error: `GitHub API error: ${error}` },
          { status: userResponse.status }
        )
      }

      const user = await userResponse.json()
      const username = user.login

      // Build search query for user's repositories
      const searchUrl = new URL('https://api.github.com/search/repositories')
      // Search in user's repositories with the query
      searchUrl.searchParams.set('q', `${q} user:${username} in:name,description`)
      searchUrl.searchParams.set('sort', sort === 'full_name' ? 'updated' : sort)
      searchUrl.searchParams.set('order', direction)
      searchUrl.searchParams.set('per_page', perPage.toString())
      searchUrl.searchParams.set('page', page.toString())

      const response = await fetch(searchUrl.toString(), {
        headers,
        cache: 'no-store',
      })

      if (!response.ok) {
        const error = await response.text()
        return NextResponse.json(
          { error: `GitHub API error: ${error}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json({
        repositories: data.items as GitHubRepository[],
        total_count: data.total_count,
        page,
        per_page: perPage,
      })
    }

    // Otherwise, use the repos API
    const url = new URL('https://api.github.com/user/repos')
    url.searchParams.set('type', type)
    url.searchParams.set('sort', sort)
    url.searchParams.set('direction', direction)
    url.searchParams.set('per_page', perPage.toString())
    url.searchParams.set('page', page.toString())
    url.searchParams.set('affiliation', 'owner,collaborator,organization_member')

    const response = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: `GitHub API error: ${error}` },
        { status: response.status }
      )
    }

    const repositories = (await response.json()) as GitHubRepository[]

    // Get total count by fetching user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers,
      cache: 'no-store',
    })

    let totalCount = repositories.length
    if (userResponse.ok) {
      const user = await userResponse.json()
      totalCount = user.public_repos + (user.total_private_repos || 0)
    }

    return NextResponse.json({
      repositories,
      total_count: totalCount,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}
