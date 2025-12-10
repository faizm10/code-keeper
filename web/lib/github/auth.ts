import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Check if an error is a network/DNS error (non-critical, can be retried)
 */
function isNetworkError(error: unknown): boolean {
  if (!error) return false
  
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorCode = (error as any)?.code || (error as any)?.cause?.code
  
  // Check for DNS/network errors
  return (
    errorCode === 'ENOTFOUND' ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ETIMEDOUT' ||
    errorCode === 'ENETUNREACH' ||
    errorMessage.includes('getaddrinfo') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('NetworkError') ||
    (error as any)?.__isAuthError === true && (error as any)?.status === 0
  )
}

export async function getGitHubAccessToken() {
  const supabase = await createClient()

  const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] =
    await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser(),
    ])

  // Handle network errors gracefully
  if (sessionError || userError) {
    const error = sessionError || userError || new Error('Failed to verify Supabase session')
    
    // Check if it's a network error
    if (isNetworkError(error)) {
      console.warn('Network error accessing Supabase session:', error instanceof Error ? error.message : String(error))
    }
    
    return { error }
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
      // Only log as error if it's not a network issue
      if (isNetworkError(adminError)) {
        console.warn('Network error fetching GitHub token via admin client:', adminError instanceof Error ? adminError.message : String(adminError))
      } else {
        console.error('Failed to fetch GitHub token via admin client', adminError)
      }
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

/**
 * Check if user has a valid GitHub connection (has GitHub identity and accessible token)
 * This is more reliable than just checking for provider_token in session
 * 
 * Returns false for network errors to avoid blocking the UI, but logs them for debugging
 */
export async function hasGitHubConnection(): Promise<boolean> {
  try {
    const { token, error } = await getGitHubAccessToken()
    
    // If we have a token, connection is valid
    if (token) return true
    
    // If error is a network issue, return false but don't log as error
    // (network issues are temporary and shouldn't block the UI)
    if (error && isNetworkError(error)) {
      console.warn('Network error checking GitHub connection:', error instanceof Error ? error.message : String(error))
      return false
    }
    
    // For other errors (auth errors, missing token, etc.), return false
    return false
  } catch (error) {
    // Catch any unexpected errors
    if (isNetworkError(error)) {
      console.warn('Network error in hasGitHubConnection:', error instanceof Error ? error.message : String(error))
    } else {
      console.error('Error checking GitHub connection:', error)
    }
    return false
  }
}


