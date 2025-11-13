import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
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

    // Get all PR runs for this repo and user
    const { data: runs, error } = await supabase
      .from('pr_runs')
      .select('*')
      .eq('user_id', user.id)
      .eq('repo_full_name', repoFullName)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({ runs: runs || [] })
  } catch (error) {
    console.error('Error fetching PR runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PR runs' },
      { status: 500 }
    )
  }
}

