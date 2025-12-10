import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RepositoryOnboarding } from '@/components/dashboard/repository-onboarding'
import { hasGitHubConnection } from '@/lib/github/auth'

// Force dynamic rendering to ensure auth check happens at runtime
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if GitHub is connected with a valid token
  // If network error occurs, default to false and let client-side handle it
  let isGitHubConnected = false
  try {
    isGitHubConnected = await hasGitHubConnection()
  } catch (error) {
    // Network errors are handled gracefully in hasGitHubConnection
    // Just log and continue - the client-side component will handle the check
    console.warn('Could not check GitHub connection status on server:', error)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome to Code Keeper</h1>
        <p className="text-muted-foreground text-lg">
          Hello, {user?.email || user?.user_metadata?.full_name || 'User'}!
        </p>
      </div>

      <RepositoryOnboarding initialGitHubConnected={isGitHubConnected} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Repositories</h2>
          <p className="text-muted-foreground mb-4">
            Manage your code repositories and sync from GitHub.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/repositories">View Repositories</Link>
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Snippets</h2>
          <p className="text-muted-foreground mb-4">
            Save and organize your code snippets.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/snippets">View Snippets</Link>
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <p className="text-muted-foreground mb-4">
            Manage your account and preferences.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">Go to Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

