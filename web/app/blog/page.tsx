import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Blog - Code Keeper",
  description: "Code Keeper blog and updates.",
};

export default function BlogPage() {
  return (
    <ComingSoon
      title="Blog"
      description="Stay tuned for updates, tutorials, and insights about code management and development."
    />
  );
}

