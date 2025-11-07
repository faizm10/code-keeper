import Hero from "@/components/sections/hero/default";
import Navbar from "@/components/sections/navbar/default";
import FooterSection from "@/components/sections/footer/default";
import Navigation from "@/components/ui/navigation";
import Screenshot from "@/components/ui/screenshot";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import Github from "@/components/logos/github";

export default function Home() {
  return (
    <>
      <Navbar
        name="Code Keeper"
        homeUrl="/"
        logo={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            CK
          </div>
        }
        mobileLinks={[
          { text: "Features", href: "#features" },
          { text: "Documentation", href: "/docs" },
          { text: "Get Started", href: "#get-started" },
        ]}
        actions={[
          { text: "Sign in", href: "#signin", isButton: false },
          {
            text: "Get Started",
            href: "#get-started",
            isButton: true,
            variant: "default",
          },
        ]}
        customNavigation={
          <Navigation
            menuItems={[
              {
                title: "Product",
                content: "default",
              },
              {
                title: "Resources",
                content: "components",
              },
              {
                title: "Documentation",
                isLink: true,
                href: "/docs",
              },
            ]}
            components={[
              {
                title: "API Reference",
                href: "/docs/api",
                description: "Complete API documentation for Code Keeper endpoints.",
              },
              {
                title: "Guides",
                href: "/docs/guides",
                description: "Step-by-step guides to help you get started.",
              },
              {
                title: "Docker Setup",
                href: "/docs/docker",
                description: "Learn how to deploy Code Keeper with Docker.",
              },
              {
                title: "Web App Guide",
                href: "/docs/web",
                description: "Documentation for the Next.js web application.",
              },
            ]}
            logo={
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                CK
              </div>
            }
            logoTitle="Code Keeper"
            logoDescription="A modern platform for managing code repositories, snippets, and development resources."
            logoHref="/"
            introItems={[
              {
                title: "Features",
                href: "#features",
                description: "Discover what Code Keeper can do for you.",
              },
              {
                title: "Getting Started",
                href: "#get-started",
                description: "Quick start guide to set up Code Keeper.",
              },
              {
                title: "About",
                href: "#about",
                description: "Learn more about Code Keeper and our mission.",
              },
            ]}
          />
        }
        showNavigation={true}
      />
      <Hero
        title="Keep your code organized and accessible"
        description="A modern platform for managing code repositories, snippets, and development resources. Built for developers who value organization and efficiency."
        badge={
          <Badge variant="outline">
            <span className="text-muted-foreground">
              New version of Code Keeper is out!
            </span>
            <a href="#get-started" className="flex items-center gap-1">
              Get started
              <ArrowRightIcon className="size-3" />
            </a>
          </Badge>
        }
        buttons={[
          {
            href: "#get-started",
            text: "Get Started",
            variant: "default",
          },
          {
            href: "https://github.com",
            text: "GitHub",
            variant: "glow",
            icon: <Github className="mr-2 size-4" />,
          },
        ]}
        mockup={
          <Screenshot
            srcLight="/dashboard-placeholder.svg"
            srcDark="/dashboard-placeholder-dark.svg"
            alt="Code Keeper dashboard preview"
            width={1248}
            height={765}
            className="w-full"
          />
        }
      />
      <FooterSection
        name="Code Keeper"
        logo={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            CK
          </div>
        }
        columns={[
          {
            title: "Product",
            links: [
              { text: "Features", href: "#features" },
              { text: "Documentation", href: "/docs" },
              { text: "Changelog", href: "#changelog" },
            ],
          },
          {
            title: "Resources",
            links: [
              { text: "Documentation", href: "/docs" },
              { text: "API Reference", href: "/docs/api" },
              { text: "Guides", href: "/docs/guides" },
            ],
          },
          {
            title: "Company",
            links: [
              { text: "About", href: "#about" },
              { text: "Blog", href: "#blog" },
              { text: "Contact", href: "#contact" },
            ],
          },
        ]}
        copyright="© 2025 Code Keeper. All rights reserved."
        policies={[
          { text: "Privacy Policy", href: "/privacy" },
          { text: "Terms of Service", href: "#terms" },
        ]}
        showModeToggle={true}
      />
    </>
  );
}
