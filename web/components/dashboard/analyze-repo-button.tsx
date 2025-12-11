'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface AnalyzeRepoButtonProps {
  owner: string
  repo: string
}

export function AnalyzeRepoButton({ owner, repo }: AnalyzeRepoButtonProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const router = useRouter()

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true)
      const response = await fetch(
        `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/analyze`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to analyze repository')
      }

      const data = await response.json()
      toast.success('Repository analyzed successfully!', {
        description: `Found ${data.stats.docs.count} documentation files and ${data.stats.files.total} total files`,
      })
      
      // Refresh the page to show updated analysis
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to analyze repository')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Button
      onClick={handleAnalyze}
      disabled={analyzing}
      className="gap-2"
    >
      {analyzing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Analyze Repo
        </>
      )}
    </Button>
  )
}

