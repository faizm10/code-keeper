import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Web App Guide - Code Keeper",
  description: "Next.js web application documentation.",
};

export default function WebDocsPage() {
  return (
    <ComingSoon
      title="Web App Guide"
      description="Documentation for the Next.js web application is coming soon."
    />
  );
}

