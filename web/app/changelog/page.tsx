import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Changelog - Code Keeper",
  description: "Code Keeper version history and updates.",
};

export default function ChangelogPage() {
  return (
    <ComingSoon
      title="Changelog"
      description="Version history and release notes will be available here soon."
    />
  );
}

