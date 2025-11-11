'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Section = {
  id: string
  title: string
}

type ScrollSpyContainerProps = {
  sections: Section[]
  className?: string
}

export default function ScrollSpyContainer({ sections, className }: ScrollSpyContainerProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-40% 0px -55% 0px',
        threshold: [0, 0.2, 0.6, 1],
      },
    )

    sections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (el) {
        observer.observe(el)
      }
    })

    return () => {
      sections.forEach((section) => {
        const el = document.getElementById(section.id)
        if (el) {
          observer.unobserve(el)
        }
      })
      observer.disconnect()
    }
  }, [sections])

  return (
    <nav className={className}>
      <div>
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">On this page</p>
        <ul className="mt-3 space-y-2">
          {sections.map((section) => {
            const isActive = section.id === activeId
            return (
              <li key={section.id}>
                <Link
                  href={`#${section.id}`}
                  className={[
                    'block rounded-md px-2 py-1 text-sm transition',
                    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ].join(' ')}
                >
                  {section.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}


