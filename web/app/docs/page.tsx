import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Documentation - Code Keeper",
  description: "Code Keeper documentation and guides.",
};

export default function DocsPage() {
  return (
    <ComingSoon
      title="Documentation"
      description="Comprehensive documentation is coming soon. In the meantime, check out our GitHub repository for setup instructions."
    />
  );
}

