import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Features - Code Keeper",
  description: "Discover the features of Code Keeper.",
};

export default function FeaturesPage() {
  return (
    <ComingSoon
      title="Features"
      description="We're building amazing features to help you manage your code repositories and snippets. Stay tuned!"
    />
  );
}

