'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, MessageSquare } from 'lucide-react'

interface PRAdviceButtonProps {
  owner: string
  repo: string
  prNumber: number
}

export function PRAdviceButton({ owner, repo, prNumber }: PRAdviceButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleTriggerAdvice = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/${prNumber}/advice`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate PR advice')
      }

      const data = await response.json()
      
      if (data.comment_id) {
        toast.success('PR advice comment posted!', {
          description: 'Check the PR on GitHub to see the comment',
          duration: 5000,
        })
      } else {
        toast.success('PR advice generated successfully!')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate PR advice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleTriggerAdvice}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4" />
          Get Codekeeper Advice
        </>
      )}
    </Button>
  )
}

