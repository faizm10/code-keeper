'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/sections/navbar/default'
import Navigation from '@/components/ui/navigation'

type NavbarVisibilityProps = {
  user: { id: string } | null
}

const mobileLinks = [
  { text: 'Features', href: '/features' },
  { text: 'Documentation', href: '/docs' },
  { text: 'Get Started', href: '/get-started' },
]

export default function NavbarVisibility({ user }: NavbarVisibilityProps) {
  const pathname = usePathname()
  const showNavbar = !pathname?.startsWith('/dashboard')

  if (!showNavbar) {
    return null
  }

  const actions = user
    ? [{ text: 'Dashboard', href: '/dashboard', isButton: true, variant: 'default' as const }]
    : [
        { text: 'Sign in', href: '/auth/login', isButton: false as const },
        { text: 'Get Started', href: '/auth/signup', isButton: true as const, variant: 'default' as const },
      ]

  return (
    <Navbar
      name="Code Keeper"
      homeUrl="/"
      logo={
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          CK
        </div>
      }
      mobileLinks={mobileLinks}
      actions={actions}
      customNavigation={
        <Navigation
          menuItems={[
            { title: 'Product', content: 'default' },
            { title: 'Resources', content: 'components' },
            { title: 'Documentation', isLink: true, href: '/docs' },
          ]}
          components={[
            {
              title: 'API Reference',
              href: '/docs/api',
              description: 'Understand the endpoints that power Code Keeper integrations.',
            },
            {
              title: 'Guides',
              href: '/docs/guides',
              description: 'Deep dives into workflow automation and best practices.',
            },
            {
              title: 'Web App Guide',
              href: '/docs/web',
              description: 'Explore the Code Keeper web experience and configuration.',
            },
            {
              title: 'Docker Setup',
              href: '/docs/docker',
              description: 'Learn how to deploy Code Keeper with Docker.',
            },
          ]}
          logo={
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              CK
            </div>
          }
          logoTitle="Code Keeper"
          logoDescription="Automatically maintain your documentation and architecture after every merge or pull request."
          logoHref="/"
          introItems={[
            {
              title: 'Features',
              href: '/features',
              description: 'Discover what Code Keeper can do for you.',
            },
            {
              title: 'Getting Started',
              href: '/get-started',
              description: 'Quick start guide to set up Code Keeper.',
            },
            {
              title: 'About',
              href: '/about',
              description: 'Learn more about Code Keeper and our mission.',
            },
          ]}
        />
      }
      showNavigation
    />
  )
}


