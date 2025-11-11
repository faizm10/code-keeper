import { cn } from '@/lib/utils'
import FooterSection from '@/components/sections/footer/default'

interface DashboardFooterProps {
  className?: string
}

export function DashboardFooter({ className }: DashboardFooterProps) {
  return (
    <FooterSection
      className={cn('mt-16 border-t border-border/60 bg-muted/20', className)}
      name="Code Keeper"
      logo={
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          CK
        </div>
      }
      columns={[
        {
          title: 'Product',
          links: [
            { text: 'Dashboard', href: '/dashboard' },
            { text: 'Repositories', href: '/dashboard/repositories' },
            { text: 'Snippets', href: '/dashboard/snippets' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { text: 'Documentation', href: '/docs' },
            { text: 'API Reference', href: '/docs/api' },
            { text: 'Guides', href: '/docs/guides' },
          ],
        },
        {
          title: 'Company',
          links: [
            { text: 'About', href: '/about' },
            { text: 'Contact', href: '/contact' },
          ],
        },
      ]}
      copyright="© 2025 Code Keeper. All rights reserved."
      policies={[
        { text: 'Privacy Policy', href: '/privacy' },
        { text: 'Terms of Service', href: '/terms' },
      ]}
      showModeToggle
    />
  )
}


