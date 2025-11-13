import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsProfile } from '@/components/dashboard/settings-profile'
import { SettingsGitHub } from '@/components/dashboard/settings-github'
import { SettingsAccount } from '@/components/dashboard/settings-account'
import { SettingsPreferences } from '@/components/dashboard/settings-preferences'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check GitHub integration
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session
  const hasGitHub = session?.provider_token || 
    user.identities?.some(identity => identity.provider === 'github')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your profile information and personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsProfile user={user} />
          </CardContent>
        </Card>

        {/* GitHub Integration */}
        <Card>
          <CardHeader>
            <CardTitle>GitHub Integration</CardTitle>
            <CardDescription>
              Connect your GitHub account to sync repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsGitHub hasGitHub={!!hasGitHub} />
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your application preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsPreferences />
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account settings and security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsAccount user={user} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
