'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'

interface SettingsAccountProps {
  user: User
}

export function SettingsAccount({ user }: SettingsAccountProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setNewPassword('')
      setConfirmPassword('')
      alert('Password updated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    if (!confirm('This will permanently delete all your data, repositories, and snippets. Are you absolutely sure?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // In a real app, you would call an API endpoint to delete the account
      // This would handle cleanup of all user data
      alert('Account deletion is not yet implemented. Please contact support to delete your account.')
      // const response = await fetch('/api/account/delete', { method: 'DELETE' })
      // if (!response.ok) throw new Error('Failed to delete account')
      // router.push('/auth/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Change Password</h3>
          <p className="text-sm text-muted-foreground">
            Update your password to keep your account secure
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </div>

      <Separator />

      {/* Account Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Account Information</h3>
          <p className="text-sm text-muted-foreground">
            View your account details
          </p>
        </div>

        <div className="space-y-2">
          <Label>User ID</Label>
          <Input
            value={user.id}
            disabled
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label>Account Created</Label>
          <Input
            value={new Date(user.created_at).toLocaleDateString()}
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label>Last Sign In</Label>
          <Input
            value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
            disabled
          />
        </div>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1 text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">
            Irreversible and destructive actions
          </p>
        </div>

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-medium text-destructive">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

