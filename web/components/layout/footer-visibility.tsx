'use client'

import { usePathname } from 'next/navigation'
import FooterSection from '@/components/sections/footer/default'

type FooterVisibilityProps = {
  footerColumns: Array<{
    title: string
    links: Array<{ text: string; href: string }>
  }>
  copyright: string
  policies: Array<{ text: string; href: string }>
  name: string
  logo: React.ReactNode
  showModeToggle?: boolean
}

export default function FooterVisibility({
  footerColumns,
  copyright,
  policies,
  name,
  logo,
  showModeToggle,
}: FooterVisibilityProps) {
  const pathname = usePathname()
  const showFooter = !pathname?.startsWith('/dashboard')

  if (!showFooter) {
    return null
  }

  return (
    <FooterSection
      name={name}
      logo={logo}
      columns={footerColumns}
      copyright={copyright}
      policies={policies}
      showModeToggle={showModeToggle}
    />
  )
}

