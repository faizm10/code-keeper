import { NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string; number: string; commentId: string }> }
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
    const commentId = resolvedParams.commentId

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`,
      { headers, cache: 'no-store' }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch comment' },
        { status: response.status }
      )
    }

    const comment = await response.json()

    return NextResponse.json({
      body: comment.body,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: comment.user,
    })
  } catch (error) {
    console.error('Error fetching comment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    )
  }
}

