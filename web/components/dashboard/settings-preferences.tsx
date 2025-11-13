'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function SettingsPreferences() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [repositorySync, setRepositorySync] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load preferences from localStorage or user settings
    if (typeof window !== 'undefined') {
      const storedEmailNotifications = localStorage.getItem('emailNotifications')
      const storedRepositorySync = localStorage.getItem('repositorySync')
      
      if (storedEmailNotifications !== null) {
        setEmailNotifications(storedEmailNotifications === 'true')
      }
      if (storedRepositorySync !== null) {
        setRepositorySync(storedRepositorySync === 'true')
      }
    }
  }, [])

  const handleSave = async () => {
    if (!mounted) return
    
    setLoading(true)
    setSuccess(false)

    try {
      // Save preferences to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('emailNotifications', String(emailNotifications))
        localStorage.setItem('repositorySync', String(repositorySync))
      }

      // In a real app, you would save these to the database
      // await saveUserPreferences({ emailNotifications, repositorySync })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return <div className="space-y-6">Loading preferences...</div>
  }

  return (
    <div className="space-y-6">
      {/* Theme Preference */}
      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label>Theme</Label>
          <p className="text-sm text-muted-foreground">
            Choose your preferred theme (light, dark, or system)
          </p>
        </div>
        <ModeToggle />
      </div>

      {/* Email Notifications */}
      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5 flex-1">
          <Label htmlFor="emailNotifications">Email Notifications</Label>
          <p className="text-sm text-muted-foreground">
            Receive email notifications for important updates
          </p>
        </div>
        <Switch
          id="emailNotifications"
          checked={emailNotifications}
          onCheckedChange={setEmailNotifications}
          disabled={loading}
        />
      </div>

      {/* Repository Sync */}
      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5 flex-1">
          <Label htmlFor="repositorySync">Automatic Repository Sync</Label>
          <p className="text-sm text-muted-foreground">
            Automatically sync repositories when changes are detected
          </p>
        </div>
        <Switch
          id="repositorySync"
          checked={repositorySync}
          onCheckedChange={setRepositorySync}
          disabled={loading}
        />
      </div>

      {success && (
        <div className="rounded-md bg-primary/10 border border-primary/20 p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <p className="text-sm text-primary">Preferences saved successfully!</p>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  )
}

