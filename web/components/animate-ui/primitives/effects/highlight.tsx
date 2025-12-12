'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface HighlightProps {
  enabled?: boolean
  hover?: boolean
  controlledItems?: boolean
  mode?: 'parent' | 'child'
  containerClassName?: string
  transition?: any
  forceUpdateBounds?: boolean
  children: React.ReactNode
}

export function Highlight({
  enabled = false,
  hover = false,
  controlledItems = false,
  mode = 'parent',
  containerClassName,
  transition,
  forceUpdateBounds,
  children,
}: HighlightProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      {children}
    </div>
  )
}

interface HighlightItemProps {
  activeClassName?: string
  children: React.ReactNode
}

export function HighlightItem({ activeClassName, children }: HighlightItemProps) {
  return <>{children}</>
}

