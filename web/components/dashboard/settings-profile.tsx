'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'

interface SettingsProfileProps {
  user: User
}

export function SettingsProfile({ user }: SettingsProfileProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [fullName, setFullName] = useState(
    user.user_metadata?.full_name || user.user_metadata?.name || ''
  )
  const [email, setEmail] = useState(user.email || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      })

      if (updateError) throw updateError

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        })

        if (emailError) throw emailError
        toast.success('Profile updated! Please check your email to verify the new address.')
      } else {
        toast.success('Profile updated successfully!')
      }

      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <p className="text-xs text-muted-foreground">
          Your email address. Changing this will require verification.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          placeholder="Enter your full name"
        />
        <p className="text-xs text-muted-foreground">
          Your display name as it appears on your profile
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  )
}

