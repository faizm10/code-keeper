import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ComingSoon from '@/components/coming-soon'

export const dynamic = 'force-dynamic'

export default async function SnippetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <ComingSoon
      title="Code Snippets"
      description="We're working on bringing you a powerful snippet management system. Save, organize, and manage your code snippets with tags and categories—coming soon!"
      fullHeight={false}
    />
  )
}
