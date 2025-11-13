import ComingSoon from "@/components/coming-soon";

// Force dynamic rendering to ensure auth check happens at runtime
export const dynamic = 'force-dynamic'

export default async function RepositoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <ComingSoon
        fullHeight={false}
        title="Repositories"
        description="We're building a powerful repository management system that will let you sync, organize, and manage all your GitHub repositories in one place. Stay tuned!"
      />
    </div>
  );
}

