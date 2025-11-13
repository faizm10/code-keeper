import ComingSoon from "@/components/coming-soon";

// Force dynamic rendering to ensure auth check happens at runtime
export const dynamic = 'force-dynamic'

export default async function SnippetsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <ComingSoon
        fullHeight={false}
        title="Code Snippets"
        description="A comprehensive snippet manager is on the way! Save, organize, and share your code snippets with tags, categories, and syntax highlighting. Coming soon!"
      />
    </div>
  );
}

