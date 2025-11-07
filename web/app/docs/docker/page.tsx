import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Docker Setup - Code Keeper",
  description: "Docker deployment guide for Code Keeper.",
};

export default function DockerDocsPage() {
  return (
    <ComingSoon
      title="Docker Setup"
      description="Docker deployment documentation and setup instructions will be available soon."
    />
  );
}

