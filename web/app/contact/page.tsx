import { Metadata } from "next";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Contact - Code Keeper",
  description: "Get in touch with the Code Keeper team.",
};

export default function ContactPage() {
  return (
    <ComingSoon
      title="Contact"
      description="Contact form and support information will be available here soon. For now, reach out via GitHub."
    />
  );
}

