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
          { text: "Features", href: "/features" },
          { text: "Documentation", href: "/docs" },
          { text: "Get Started", href: "/get-started" },
        ]}
        actions={[
          { text: "Sign in", href: "/auth/login", isButton: false },
          {
            text: "Get Started",
            href: "/auth/signup",
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
            logoDescription="Automatically maintain your documentation and architecture after every merge or pull request."
            logoHref="/"
            introItems={[
              {
                title: "Features",
                href: "/features",
                description: "Discover what Code Keeper can do for you.",
              },
              {
                title: "Getting Started",
                href: "/get-started",
                description: "Quick start guide to set up Code Keeper.",
              },
              {
                title: "About",
                href: "/about",
                description: "Learn more about Code Keeper and our mission.",
              },
            ]}
          />
        }
        showNavigation={true}
      />
      <Hero
        title="Automatically maintain your docs and architecture"
        description="Think of it like a junior dev that maintains your project automatically. Code Keeper updates documentation, performs safe refactors, and keeps your codebase aligned in real-time."
        badge={
          <Badge variant="outline">
            <span className="text-muted-foreground">
              Automatically updates docs after every PR
            </span>
            <a href="/get-started" className="flex items-center gap-1">
              Get started
              <ArrowRightIcon className="size-3" />
            </a>
          </Badge>
        }
        buttons={[
          {
            href: "/auth/signup",
            text: "Get Started",
            variant: "default",
          },
          {
            href: "/auth/login",
            text: "Sign In",
            variant: "outline",
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

      {/* What It Does Section */}
      <section className="py-24 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">✅ What It Does (Simple)</h2>
            <p className="text-lg text-muted-foreground">
              Whenever you push code, Code Keeper will:
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5 flex-shrink-0">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Detect Changes</h3>
                  <p className="text-sm text-muted-foreground">Automatically identifies what changed in your codebase</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5 flex-shrink-0">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Update Docs</h3>
                  <p className="text-sm text-muted-foreground">Keeps README, API reference, and changelog up-to-date</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5 flex-shrink-0">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Safe Refactors</h3>
                  <p className="text-sm text-muted-foreground">Performs safe code transformations (rename, move files)</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5 flex-shrink-0">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Run Tests</h3>
                  <p className="text-sm text-muted-foreground">Executes existing tests to ensure nothing broke</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5 flex-shrink-0">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Open PR</h3>
                  <p className="text-sm text-muted-foreground">Creates a pull request with all the changes</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5 flex-shrink-0">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Safe by Default</h3>
                  <p className="text-sm text-muted-foreground">No commits directly to main — everything via PR</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-2xl">
              <p className="text-lg font-medium mb-2">Think of it like a junior dev that maintains your project automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">✨ Why?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Most repos suffer from common maintenance issues
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-destructive">Common Problems</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Out-of-date documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Inconsistent folder structure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Awkward renames that never happen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Forgotten change logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Messy / drifting architecture</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-primary">Code Keeper Solution</h3>
              <p className="text-sm text-muted-foreground">
                Code Keeper fixes this by keeping your documentation and architecture aligned with your codebase <strong>in real-time</strong>. Every push triggers automatic updates, ensuring your project stays clean and well-documented without manual effort.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-24 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">🔧 High-Level Architecture</h2>
            <p className="text-lg text-muted-foreground">
              How Code Keeper works under the hood
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-2">GitHub App receives push / PR events</h3>
                  <p className="text-sm text-muted-foreground">Monitors your repository for code changes</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Analyzer inspects changed code</h3>
                  <p className="text-sm text-muted-foreground">Identifies what files, functions, and structures were modified</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Docs engine updates reference + markdown files</h3>
                  <p className="text-sm text-muted-foreground">Automatically updates README, API docs, and changelog</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Refactor engine applies safe codemods</h3>
                  <p className="text-sm text-muted-foreground">Performs safe transformations like renaming and file moves</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  5
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Test runner executes existing tests</h3>
                  <p className="text-sm text-muted-foreground">Runs your test suite to ensure nothing broke</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  6
                </div>
                <div>
                  <h3 className="font-semibold mb-2">PR bot opens a pull request</h3>
                  <p className="text-sm text-muted-foreground">Creates a PR with all the changes for your review</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">
                <strong>Everything is containerized with Docker</strong> for easy deployment and scaling
              </p>
            </div>
          </div>
        </div>
      </section>
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
              { text: "Features", href: "/features" },
              { text: "Documentation", href: "/docs" },
              { text: "Changelog", href: "/changelog" },
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
              { text: "About", href: "/about" },
              { text: "Blog", href: "/blog" },
              { text: "Contact", href: "/contact" },
            ],
          },
        ]}
        copyright="© 2025 Code Keeper. All rights reserved."
        policies={[
          { text: "Privacy Policy", href: "/privacy" },
          { text: "Terms of Service", href: "/terms" },
        ]}
        showModeToggle={true}
      />
    </>
  );
}
