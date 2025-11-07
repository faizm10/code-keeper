import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getGitHubAccessToken() {
  const supabase = await createClient()

  const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] =
    await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser(),
    ])

  if (sessionError || userError) {
    return { error: sessionError || userError || new Error('Failed to verify Supabase session') }
  }

  const session = sessionData.session
  const user = userData.user

  if (!session || !user) {
    return { error: new Error('Unauthenticated') }
  }

  let providerToken =
    session.provider_token ||
    (user.identities || [])
      .find((identity) => identity.provider === 'github')
      ?.identity_data?.access_token ||
    (user.identities || [])
      .find((identity) => identity.provider === 'github')
      ?.identity_data?.token

  if (!providerToken) {
    try {
      const adminClient = createAdminClient()
      const { data, error } = await adminClient.auth.admin.getUserById(user.id)
      if (!error) {
        const adminIdentity = (data.user?.identities || []).find(
          (identity) => identity.provider === 'github',
        )
        providerToken =
          adminIdentity?.identity_data?.access_token || adminIdentity?.identity_data?.token
      }
    } catch (adminError) {
      console.error('Failed to fetch GitHub token via admin client', adminError)
    }
  }

  if (!providerToken) {
    return {
      error: new Error(
        'Missing GitHub access token. Please reconnect your GitHub account or ensure SUPABASE_SERVICE_ROLE_KEY is set for local development.',
      ),
    }
  }

  return { token: providerToken }
}


