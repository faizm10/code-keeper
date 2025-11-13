import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'

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
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar userEmail={userEmail} userName={userName} />
      <main className="flex-1 overflow-y-auto">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
}

