import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SnippetsList } from '@/components/dashboard/snippets-list'

export const dynamic = 'force-dynamic'

export default async function SnippetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Code Snippets</h1>
        <p className="text-muted-foreground">
          Save, organize, and manage your code snippets with tags and categories
        </p>
      </div>

      <SnippetsList />
    </div>
  )
}
