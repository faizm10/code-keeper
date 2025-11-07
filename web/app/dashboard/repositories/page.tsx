import ComingSoon from "@/components/coming-soon";
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardFooter } from '@/components/dashboard/dashboard-footer'

// Force dynamic rendering to ensure auth check happens at runtime
export const dynamic = 'force-dynamic'

export default async function RepositoriesPage() {
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
          title="Repositories"
          description="We're building a powerful repository management system that will let you sync, organize, and manage all your GitHub repositories in one place. Stay tuned!"
        />
      </div>
      <DashboardFooter />
    </div>
  );
}

