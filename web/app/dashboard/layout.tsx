import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarWrapper } from '@/components/dashboard/sidebar-wrapper'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const userEmail = user.email || undefined
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || undefined

  return (
    <SidebarWrapper userEmail={userEmail} userName={userName}>
      {children}
    </SidebarWrapper>
  )
}

