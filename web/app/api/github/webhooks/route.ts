import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGitHubAccessToken } from '@/lib/github/auth'

export const dynamic = 'force-dynamic'

type GitHubPullRequestWebhook = {
  action: string
  number: number
  pull_request: {
    number: number
    title: string
    state: string
    base: {
      sha: string
      ref: string
    }
    head: {
      sha: string
      ref: string
    }
    user: {
      login: string
    }
  }
  repository: {
    full_name: string
    owner: {
      login: string
    }
    name: string
  }
  installation?: {
    id: number
  }
}

// This endpoint will be called by GitHub webhooks
// For now, it will be a manual trigger via API call
// In production, you'd set up webhook secret verification
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GitHubPullRequestWebhook

    // Verify webhook secret in production
    // const signature = request.headers.get('x-hub-signature-256')
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    // Only process opened and synchronize events
    if (body.action !== 'opened' && body.action !== 'synchronize') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repoFullName = body.repository.full_name
    const prNumber = body.pull_request.number

    // Create a PR run entry
    const { data: prRun, error: dbError } = await supabase
      .from('pr_runs')
      .insert({
        user_id: user.id,
        repo_full_name: repoFullName,
        pr_number: prNumber,
        run_type: 'advice',
        status: 'pending',
        base_sha: body.pull_request.base.sha,
        head_sha: body.pull_request.head.sha,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create PR run' },
        { status: 500 }
      )
    }

    // Trigger the PR advice job asynchronously
    // In a real system, you'd use a job queue (e.g., BullMQ, Inngest)
    // For now, we'll process it immediately
    try {
      // Call internal API to process the PR advice
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/repositories/${encodeURIComponent(repoFullName)}/prs/${prNumber}/advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          run_id: prRun.id,
          user_id: user.id,
        }),
      })
    } catch (error) {
      console.error('Error triggering PR advice:', error)
      // Update run status to failed
      await supabase
        .from('pr_runs')
        .update({ status: 'failed', logs: { error: 'Failed to trigger advice job' } })
        .eq('id', prRun.id)
    }

    return NextResponse.json({ success: true, run_id: prRun.id })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// Manual trigger endpoint for testing
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const repo = searchParams.get('repo')
  const pr = searchParams.get('pr')

  if (!repo || !pr) {
    return NextResponse.json(
      { error: 'Missing repo or pr parameter' },
      { status: 400 }
    )
  }

  const [owner, repoName] = repo.split('/')
  const prNumber = parseInt(pr, 10)

  if (!owner || !repoName || isNaN(prNumber)) {
    return NextResponse.json(
      { error: 'Invalid repo or pr parameter' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Trigger PR advice manually
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(
      `${baseUrl}/api/repositories/${encodeURIComponent(repo)}/prs/${prNumber}/advice`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to trigger PR advice' },
      { status: 500 }
    )
  }
}

