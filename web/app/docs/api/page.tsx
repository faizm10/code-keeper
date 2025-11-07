import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "API Reference - Code Keeper",
  description: "Code Keeper API documentation.",
};

export default function ApiDocsPage() {
  return (
    <ComingSoon
      title="API Reference"
      description="Complete API documentation with endpoints, authentication, and examples will be available soon."
    />
  );
}

