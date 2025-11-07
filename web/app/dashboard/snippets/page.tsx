import ComingSoon from "@/components/coming-soon";
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SnippetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <ComingSoon
      title="Code Snippets"
      description="A comprehensive snippet manager is on the way! Save, organize, and share your code snippets with tags, categories, and syntax highlighting. Coming soon!"
    />
  );
}

