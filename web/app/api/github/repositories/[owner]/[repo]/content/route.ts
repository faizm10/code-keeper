import { NextRequest, NextResponse } from 'next/server'
import { getGitHubAccessToken } from '@/lib/github/auth'

type RouteParams = { owner: string; repo: string }

export async function GET(
  request: NextRequest,
  context: { params: RouteParams | Promise<RouteParams> },
) {
  try {
    const resolvedParams = await context.params
    const ownerParam = decodeURIComponent(resolvedParams.owner)
    const repoParam = decodeURIComponent(resolvedParams.repo)

    const owner = ownerParam.startsWith('@') ? ownerParam.slice(1) : ownerParam
    const repo = repoParam.endsWith('.git') ? repoParam.slice(0, -4) : repoParam

    const { searchParams } = new URL(request.url)
    const pathParam = searchParams.get('path')
    const refParam = searchParams.get('ref')

    if (!pathParam) {
      return NextResponse.json({ error: 'Missing file path' }, { status: 400 })
    }

    // Disallow attempting to traverse outside the repo root.
    if (pathParam.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const { token, error } = await getGitHubAccessToken()

    if (error || !token) {
      return NextResponse.json(
        { error: error?.message ?? 'Unable to authenticate with GitHub' },
        { status: error?.message === 'Unauthenticated' ? 401 : 400 },
      )
    }

    const encodedPath = pathParam
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')

    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`)
    if (refParam) {
      url.searchParams.set('ref', refParam)
    }

    const githubResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    })

    if (githubResponse.status === 404) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (githubResponse.status === 401) {
      return NextResponse.json(
        { error: 'GitHub authentication failed. Please reconnect your GitHub account.' },
        { status: 401 },
      )
    }

    if (!githubResponse.ok) {
      const body = await githubResponse.json().catch(() => ({}))
      console.error('GitHub file content error', githubResponse.status, body)
      return NextResponse.json(
        { error: 'Failed to load file contents from GitHub' },
        { status: 502 },
      )
    }

    const data = await githubResponse.json()
    const { content, encoding, size, name, path, sha, html_url: htmlUrl } = data

    if (encoding !== 'base64' || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Unsupported file encoding. Only base64 encoded files are supported.' },
        { status: 415 },
      )
    }

    const decoded = Buffer.from(content, 'base64')

    return new NextResponse(decoded, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-GitHub-File-Name': encodeURIComponent(name),
        'X-GitHub-File-Path': encodeURIComponent(path),
        'X-GitHub-File-Size': size ? String(size) : '',
        'X-GitHub-File-Sha': sha ?? '',
        'X-GitHub-File-Url': htmlUrl ?? '',
      },
    })
  } catch (err) {
    console.error('Unexpected error retrieving file content', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}


