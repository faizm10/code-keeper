import ComingSoon from "@/components/coming-soon";
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardFooter } from '@/components/dashboard/dashboard-footer'

// Force dynamic rendering to ensure auth check happens at runtime
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1">
        <ComingSoon
          fullHeight={false}
          title="Settings"
          description="Account settings and preferences are being developed. You'll be able to manage your profile, GitHub integration, notifications, and more. Check back soon!"
        />
      </div>
      <DashboardFooter />
    </div>
  );
}

