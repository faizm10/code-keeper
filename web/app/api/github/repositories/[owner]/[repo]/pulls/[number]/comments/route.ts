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
    const prNumber = parseInt(resolvedParams.number, 10)

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    // Fetch all comments for the PR
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100`,
      { headers, cache: 'no-store' }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: response.status }
      )
    }

    const comments = await response.json()

    // Filter out Codekeeper comments and vercel[bot] comments
    const filteredComments = comments.filter((comment: any) => {
      const body = comment.body || ''
      const userLogin = comment.user?.login || ''
      
      // Exclude Codekeeper comments (contains the marker)
      if (body.includes('<!-- codekeeper:advice:')) {
        return false
      }
      
      // Exclude vercel[bot] comments
      if (userLogin === 'vercel[bot]' || userLogin.toLowerCase().includes('vercel')) {
        return false
      }
      
      return true
    })

    return NextResponse.json({
      comments: filteredComments.map((comment: any) => ({
        id: comment.id,
        body: comment.body,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: comment.user,
        html_url: comment.html_url,
      })),
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

