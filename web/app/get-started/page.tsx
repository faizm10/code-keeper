import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Get Started - Code Keeper",
  description: "Get started with Code Keeper.",
};

export default function GetStartedPage() {
  return (
    <ComingSoon
      title="Get Started"
      description="Quick start guide and setup instructions are coming soon. Check our GitHub repository for installation steps."
    />
  );
}

