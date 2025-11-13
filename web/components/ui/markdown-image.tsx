'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarkdownImageProps {
  src?: string
  alt?: string
  title?: string
  className?: string
}

export function MarkdownImage({ src, alt, title, className }: MarkdownImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src) {
      setHasError(true)
      setIsLoading(false)
    } else {
      setIsLoading(true)
      setHasError(false)
    }
  }, [src])

  if (!src || hasError) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-4 my-4', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Failed to load image</p>
          {src && (
            <p className="text-xs text-muted-foreground break-all max-w-md">
              {src}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Check if it's an external URL
  const isExternal = src.startsWith('http://') || src.startsWith('https://')
  const isDataUrl = src.startsWith('data:')
  const isRelative = src.startsWith('/')

  // For data URLs, use regular img tag
  if (isDataUrl) {
    return (
      <div className={cn('relative my-4', className)}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <img
          src={src}
          alt={alt || title || 'Markdown image'}
          title={title}
          className={cn(
            'max-w-full h-auto rounded-lg',
            isLoading && 'opacity-0',
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
          loading="lazy"
        />
      </div>
    )
  }

  // For external and relative images, use Next.js Image component
  // Next.js will handle fetching and optimization
  return (
    <div className={cn('relative my-4', className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted z-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <Image
        src={src}
        alt={alt || title || 'Markdown image'}
        width={1200}
        height={800}
        className={cn(
          'max-w-full h-auto rounded-lg',
          isLoading && 'opacity-0'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        loading="lazy"
        unoptimized={isDataUrl}
      />
    </div>
  )
}

