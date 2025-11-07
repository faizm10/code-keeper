import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Guides - Code Keeper",
  description: "Step-by-step guides for Code Keeper.",
};

export default function GuidesPage() {
  return (
    <ComingSoon
      title="Guides"
      description="Helpful guides and tutorials to get you started with Code Keeper are coming soon."
    />
  );
}

