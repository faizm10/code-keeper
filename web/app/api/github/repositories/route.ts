import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'

type GitHubRepo = {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  language: string | null
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
  stargazers_count: number
  updated_at: string
}

export async function GET(request: Request) {
  try {
    const { token, error } = await getGitHubAccessToken()

    if (error || !token) {
      return NextResponse.json(
        { error: error?.message ?? 'Unable to authenticate with GitHub' },
        { status: error?.message === 'Unauthenticated' ? 401 : 400 },
      )
    }

    const { searchParams } = new URL(request.url)
    const visibility = searchParams.get('visibility') ?? 'all'
    const affiliation = searchParams.get('affiliation') ?? 'owner,collaborator,organization_member'
    const perPage = parseInt(searchParams.get('per_page') ?? '50', 10)

    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${Math.min(perPage, 100)}&sort=updated&visibility=${visibility}&affiliation=${encodeURIComponent(
        affiliation,
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    )

    if (response.status === 401) {
      return NextResponse.json(
        { error: 'GitHub authentication failed. Please reconnect your GitHub account.' },
        { status: 401 },
      )
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      console.error('GitHub API error', response.status, errorBody)
      return NextResponse.json(
        { error: 'Failed to load repositories from GitHub' },
        { status: 502 },
      )
    }

    const data = (await response.json()) as GitHubRepo[]
    const search = searchParams.get('search')?.toLowerCase()
    const repositories = data
      .filter((repo) => {
        if (!search) return true
        const haystack = `${repo.name} ${repo.full_name} ${repo.description ?? ''}`.toLowerCase()
        return haystack.includes(search)
      })
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        language: repo.language,
        stars: repo.stargazers_count,
        htmlUrl: repo.html_url,
        owner: {
          login: repo.owner.login,
          avatarUrl: repo.owner.avatar_url,
        },
        updatedAt: repo.updated_at,
      }))

    return NextResponse.json({ repositories })
  } catch (error) {
    console.error('Unexpected error fetching GitHub repositories', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}


