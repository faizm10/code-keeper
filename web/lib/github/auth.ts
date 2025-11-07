import { createClient } from '@/lib/supabase/server'

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

  const providerToken =
    session.provider_token ||
    (user.identities || [])
      .find((identity) => identity.provider === 'github')
      ?.identity_data?.access_token ||
    (user.identities || [])
      .find((identity) => identity.provider === 'github')
      ?.identity_data?.token

  if (!providerToken) {
    return {
      error: new Error('Missing GitHub access token. Please reconnect your GitHub account.'),
    }
  }

  return { token: providerToken }
}


