import ComingSoon from "@/components/coming-soon";

// Force dynamic rendering to ensure auth check happens at runtime
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <ComingSoon
        fullHeight={false}
        title="Settings"
        description="Account settings and preferences are being developed. You'll be able to manage your profile, GitHub integration, notifications, and more. Check back soon!"
      />
    </div>
  );
}

