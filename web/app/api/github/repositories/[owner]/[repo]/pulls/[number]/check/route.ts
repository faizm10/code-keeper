import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string; number: string }> }
) {
  try {
    const { token, error } = await getGitHubAccessToken()

    if (error || !token) {
      return NextResponse.json(
        { error: error?.message || 'Missing GitHub access token' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const owner = decodeURIComponent(resolvedParams.owner)
    const repo = decodeURIComponent(resolvedParams.repo)
    const number = parseInt(resolvedParams.number, 10)

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
      { headers, cache: 'no-store' }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch PR details' },
        { status: response.status }
      )
    }

    const pr = await response.json()

    return NextResponse.json({
      head_sha: pr.head?.sha,
      commits: pr.commits,
      updated_at: pr.updated_at,
    })
  } catch (error) {
    console.error('Error checking PR updates:', error)
    return NextResponse.json(
      { error: 'Failed to check PR updates' },
      { status: 500 }
    )
  }
}

