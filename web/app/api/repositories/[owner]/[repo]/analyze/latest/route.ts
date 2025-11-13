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

    // Get the latest analysis for this repo and user
    const { data: analysis, error } = await supabase
      .from('repo_analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('repo_full_name', repoFullName)
      .order('run_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // If no analysis found, that's okay - return null
      if (error.code === 'PGRST116') {
        return NextResponse.json(null)
      }
      throw error
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error fetching latest analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest analysis' },
      { status: 500 }
    )
  }
}

