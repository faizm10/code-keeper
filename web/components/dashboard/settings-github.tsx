'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Github, Link2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSiteUrl } from '@/lib/env'

interface SettingsGitHubProps {
  hasGitHub: boolean
}

export function SettingsGitHub({ hasGitHub }: SettingsGitHubProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const redirectUrl = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent('/dashboard/settings')}`
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          scopes: 'repo read:user read:org user:email',
        },
      })

      if (error) throw error
    } catch (error) {
      console.error('Failed to connect GitHub:', error)
      toast.error('Failed to connect GitHub account. Please try again.')
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    toast.info('GitHub disconnection is not yet implemented.', {
      description: 'Please contact support if you need to disconnect your account.',
      duration: 5000,
    })
    // TODO: Implement GitHub disconnection
  }

  return (
    <div className="space-y-4">
      {hasGitHub ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium">GitHub Connected</p>
              <p className="text-sm text-muted-foreground">
                Your GitHub account is connected and you can sync repositories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('https://github.com/settings/connections/applications', '_blank')}
            >
              <Github className="mr-2 h-4 w-4" />
              Manage on GitHub
            </Button>

            <Button
              variant="outline"
              onClick={handleDisconnect}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border border-border">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">GitHub Not Connected</p>
              <p className="text-sm text-muted-foreground">
                Connect your GitHub account to sync and manage repositories
              </p>
            </div>
          </div>

          <Button onClick={handleConnect} disabled={loading}>
            {loading ? (
              <>
                <Github className="mr-2 h-4 w-4 animate-pulse" />
                Connecting...
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                Connect GitHub Account
              </>
            )}
          </Button>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Code Keeper requires access to your GitHub repositories to sync code, manage documentation, and perform automated maintenance tasks.
        </p>
      </div>
    </div>
  )
}

