import Hero from "@/components/sections/hero/default";
import Screenshot from "@/components/ui/screenshot";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import Github from "@/components/logos/github";
import { redirect } from "next/navigation";
import { LogoWall } from "@/components/sections/logo-wall";
import { NewsletterSignup } from "@/components/newsletter-signup";

type HomeSearchParams = {
  code?: string;
  state?: string;
  next?: string;
};

type HomeProps = {
  searchParams: Promise<HomeSearchParams>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  if (params?.code) {
    const query = new URLSearchParams();
    query.set("code", params.code);
    if (params.state) {
      query.set("state", params.state);
    }
    if (params.next) {
      query.set("next", params.next);
    }
    redirect(`/auth/callback?${query.toString()}`);
  }

  return (
    <>
      <Hero
        title="Automated Code Maintenance for Modern Teams"
        description="Keep your documentation, architecture, and codebase aligned automatically. Code Keeper monitors your repository and maintains consistency through intelligent automation—so you can focus on building."
        badge={
          <Badge variant="outline">
            <span className="text-muted-foreground">
              ✨ Automatically updates docs after every PR
            </span>
            <a href="/get-started" className="flex items-center gap-1 hover:text-foreground transition-colors">
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

      {/* Logo Wall Section */}
      <LogoWall 
        organizations={[
          {
            name: "uoguelph.course",
            logo: "/Test3.png",
            alt: "uoguelph.course logo",
            width: 120,
            height: 60,
            href: "https://uoguelph.courses/"
          }
        ]} 
      />

      {/* What It Does Section */}
      <section className="py-32 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every push triggers intelligent automation that keeps your project maintainable and well-documented
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-base">Detect Changes</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Intelligently identifies and analyzes changes across your codebase</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-base">Update Documentation</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Automatically maintains README, API docs, and changelogs in sync with code changes</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-base">Safe Refactoring</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Performs safe code transformations like renaming and file reorganization</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-base">Test Validation</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Runs your test suite to verify changes don't introduce regressions</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-base">Pull Request Generation</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Creates comprehensive pull requests with all proposed changes for team review</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-base">Safe by Default</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Never commits directly to main. All changes are proposed through pull requests</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Why Section */}
      <section className="py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">The Problem We Solve</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Technical debt accumulates silently. Code Keeper prevents it from happening in the first place.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-8">
              <h3 className="font-semibold mb-4 text-destructive text-lg">Common Problems</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1.5 shrink-0">•</span>
                  <span>Documentation becomes outdated as code evolves</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1.5 shrink-0">•</span>
                  <span>Inconsistent folder structures across the codebase</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1.5 shrink-0">•</span>
                  <span>Refactoring tasks that never get prioritized</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1.5 shrink-0">•</span>
                  <span>Changelogs and release notes fall behind</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1.5 shrink-0">•</span>
                  <span>Architecture drifts from original design</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-8">
              <h3 className="font-semibold mb-4 text-primary text-lg">Code Keeper Solution</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Code Keeper maintains alignment between your code, documentation, and architecture <strong>automatically</strong>. Every push triggers intelligent updates that keep your project clean and well-documented—without any manual effort.
              </p>
              <div className="mt-6 pt-6 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">
                  Focus on building features while Code Keeper handles the maintenance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action / Newsletter Section */}
      <section className="py-32 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4 tracking-tight">Stay Updated</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get notified about new features, updates, and best practices for automated code maintenance
              </p>
            </div>
            
            <NewsletterSignup />
            
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
