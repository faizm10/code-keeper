import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify confirmation from request body
    const body = await request.json().catch(() => ({}))
    if (!body.confirm || body.confirm !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation required. Send { confirm: "DELETE" } in the request body.' },
        { status: 400 }
      )
    }

    const userId = user.id
    const adminClient = createAdminClient()

    // 1. Delete all user data from custom tables (CASCADE should handle this, but doing explicitly for safety)
    // Note: repo_analyses and pr_runs have ON DELETE CASCADE, but we'll verify deletion
    const { error: analysesError } = await adminClient
      .from('repo_analyses')
      .delete()
      .eq('user_id', userId)

    if (analysesError) {
      console.error('Error deleting repo_analyses:', analysesError)
      // Continue even if this fails - CASCADE will handle it
    }

    const { error: prRunsError } = await adminClient
      .from('pr_runs')
      .delete()
      .eq('user_id', userId)

    if (prRunsError) {
      console.error('Error deleting pr_runs:', prRunsError)
      // Continue even if this fails - CASCADE will handle it
    }

    // 2. Delete the auth user (this will trigger CASCADE on all foreign keys)
    // This also removes GitHub connections stored in identities
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete user account' },
        { status: 500 }
      )
    }

    // 3. Sign out the user session
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}

