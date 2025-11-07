import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to Code Keeper</h1>
          <p className="text-muted-foreground text-lg">
            Hello, {user.email || user.user_metadata?.full_name || 'User'}!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  )
}

