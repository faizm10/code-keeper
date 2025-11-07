import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "About - Code Keeper",
  description: "Learn more about Code Keeper and our mission.",
};

export default function AboutPage() {
  return (
    <ComingSoon
      title="About"
      description="Learn more about Code Keeper, our mission, and the team behind it. This page is coming soon."
    />
  );
}

