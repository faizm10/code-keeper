import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string; number: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const owner = decodeURIComponent(resolvedParams.owner)
    const repo = decodeURIComponent(resolvedParams.repo)
    const repoFullName = `${owner}/${repo}`
    const prNumber = parseInt(resolvedParams.number, 10)

    // Fetch the latest completed advice run for this PR
    const { data: prRun, error: dbError } = await supabase
      .from('pr_runs')
      .select('*')
      .eq('user_id', user.id)
      .eq('repo_full_name', repoFullName)
      .eq('pr_number', prNumber)
      .eq('run_type', 'advice')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (dbError || !prRun) {
      return NextResponse.json({ advice: null })
    }

    return NextResponse.json({ advice: prRun })
  } catch (error) {
    console.error('Error fetching PR advice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PR advice' },
      { status: 500 }
    )
  }
}

