'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    
    try {
      // TODO: Replace with your actual newsletter API endpoint
      // For now, this is a placeholder that simulates success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsSuccess(true)
      setEmail('')
      toast.success('Successfully subscribed! Check your email for confirmation.')
      
      // Reset success state after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
        <p className="text-lg font-medium mb-2">You're all set!</p>
        <p className="text-sm text-muted-foreground text-center">
          We've sent a confirmation email. Check your inbox to verify your subscription.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <div className="flex-1 relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10 h-12"
          required
          disabled={isLoading}
        />
      </div>
      <Button 
        type="submit" 
        size="lg" 
        disabled={isLoading}
        className="h-12 px-8"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subscribing...
          </>
        ) : (
          'Subscribe'
        )}
      </Button>
    </form>
  )
}

