/**
 * Navigation Configuration
 * 
 * Centralized navigation links and menu items for the application
 */

import {
  LayoutDashboard,
  FolderGit2,
  Code2,
  Settings,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

/**
 * Dashboard sidebar navigation items
 */
export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Repositories',
    href: '/dashboard/repositories',
    icon: FolderGit2,
  },
  {
    title: 'Snippets',
    href: '/dashboard/snippets',
    icon: Code2,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

/**
 * Main site navigation menu items
 */
export interface MainNavItem {
  title: string
  href?: string
  isLink?: boolean
  content?: string
}

export const MAIN_NAV_ITEMS: MainNavItem[] = [
  {
    title: 'Getting started',
    content: 'default',
  },
  {
    title: 'Components',
    content: 'components',
  },
  {
    title: 'Documentation',
    isLink: true,
    href: '/docs',
  },
]

/**
 * Footer column configuration
 */
export interface FooterColumn {
  title: string
  links: Array<{
    text: string
    href: string
  }>
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { text: 'Features', href: '/features' },
      { text: 'Documentation', href: '/docs' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { text: 'Guides', href: '/docs/guides' },
      { text: 'API Reference', href: '/docs/api' },
      { text: 'Web App Guide', href: '/docs/web' },
    ],
  },
  {
    title: 'Company',
    links: [
      { text: 'About', href: '/about' },
      { text: 'Blog', href: '/blog' },
      { text: 'Contact', href: '/contact' },
    ],
  },
]

/**
 * Footer policy links
 */
export interface FooterPolicy {
  text: string
  href: string
}

export const FOOTER_POLICIES: FooterPolicy[] = [
  { text: 'Privacy Policy', href: '/privacy' },
  { text: 'Terms of Service', href: '/terms' },
]

/**
 * Footer copyright text
 */
export const FOOTER_COPYRIGHT = '© 2025 Code Keeper. All rights reserved.'

/**
 * Navbar action buttons
 */
export interface NavbarAction {
  text: string
  href: string
  variant?: 'default' | 'outline' | 'ghost'
  isButton?: boolean
}

export const NAVBAR_ACTIONS: NavbarAction[] = [
  {
    text: 'Sign In',
    href: '/auth/login',
    isButton: false,
  },
  {
    text: 'Get Started',
    href: '/auth/signup',
    isButton: true,
    variant: 'default',
  },
]

/**
 * Mobile navigation links
 */
export interface MobileNavLink {
  text: string
  href: string
}

export const MOBILE_NAV_LINKS: MobileNavLink[] = [
  { text: 'Features', href: '/features' },
  { text: 'Documentation', href: '/docs' },
  { text: 'Get Started', href: '/get-started' },
]

/**
 * Navigation component items for main site
 */
export interface NavigationComponent {
  title: string
  href: string
  description: string
}

export const NAVIGATION_COMPONENTS: NavigationComponent[] = [
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
]

/**
 * Navigation intro items (for dropdown menus)
 */
export interface NavigationIntroItem {
  title: string
  href: string
  description: string
}

export const NAVIGATION_INTRO_ITEMS: NavigationIntroItem[] = [
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
]

/**
 * Application branding
 */
export const APP_BRAND = {
  name: 'Code Keeper',
  logo: 'CK',
  description: 'Automatically maintain your documentation and architecture after every merge or pull request.',
  homeUrl: '/',
} as const

