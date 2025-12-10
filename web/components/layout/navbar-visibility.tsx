'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/sections/navbar/default'
import Navigation from '@/components/ui/navigation'
import {
  MOBILE_NAV_LINKS,
  MAIN_NAV_ITEMS,
  NAVIGATION_COMPONENTS,
  NAVIGATION_INTRO_ITEMS,
  APP_BRAND,
  NAVBAR_ACTIONS,
} from '@/lib/config/navigation'

type NavbarVisibilityProps = {
  user: { id: string } | null
}

export default function NavbarVisibility({ user }: NavbarVisibilityProps) {
  const pathname = usePathname()
  const showNavbar = !pathname?.startsWith('/dashboard')

  if (!showNavbar) {
    return null
  }

  const actions = user
    ? [{ text: 'Dashboard', href: '/dashboard', isButton: true, variant: 'default' as const }]
    : NAVBAR_ACTIONS

  const Logo = () => (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
      {APP_BRAND.logo}
    </div>
  )

  return (
    <Navbar
      name={APP_BRAND.name}
      homeUrl={APP_BRAND.homeUrl}
      logo={<Logo />}
      mobileLinks={MOBILE_NAV_LINKS}
      actions={actions}
      customNavigation={
        <Navigation
          menuItems={MAIN_NAV_ITEMS}
          components={NAVIGATION_COMPONENTS}
          logo={<Logo />}
          logoTitle={APP_BRAND.name}
          logoDescription={APP_BRAND.description}
          logoHref={APP_BRAND.homeUrl}
          introItems={NAVIGATION_INTRO_ITEMS}
        />
      }
      showNavigation
    />
  )
}


