import Hero from "@/components/sections/hero/default";
import Screenshot from "@/components/ui/screenshot";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import Github from "@/components/logos/github";
import { redirect } from "next/navigation";

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
        title="Automatically maintain your docs and architecture"
        description="Code Keeper is an automated maintenance system that continuously updates documentation, performs safe refactoring operations, and maintains architectural alignment in real-time. The system operates as an autonomous agent that ensures your project remains well-documented and structurally consistent."
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
            <h2 className="text-3xl font-bold mb-4">Core Functionality</h2>
            <p className="text-lg text-muted-foreground">
              When code is pushed to your repository, Code Keeper automatically performs the following operations:
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
                  <h3 className="font-semibold mb-1">Generate Pull Request</h3>
                  <p className="text-sm text-muted-foreground">Creates a pull request containing all proposed changes for review</p>
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
                  <p className="text-sm text-muted-foreground">No direct commits to the main branch. All changes are proposed through pull requests</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-2xl">
              <p className="text-lg font-medium mb-2">Code Keeper functions as an automated maintenance system that continuously maintains your project documentation and architecture.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Problem Statement</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Most software repositories encounter common maintenance challenges that impact long-term project health
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
            <h2 className="text-3xl font-bold mb-4">System Architecture</h2>
            <p className="text-lg text-muted-foreground">
              Overview of Code Keeper's operational workflow
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-2">GitHub Application Event Reception</h3>
                  <p className="text-sm text-muted-foreground">Monitors repository for push and pull request events</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Code Analysis Engine</h3>
                  <p className="text-sm text-muted-foreground">Analyzes modified files, functions, and structural changes</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Documentation Engine</h3>
                  <p className="text-sm text-muted-foreground">Automatically updates reference documentation and markdown files including README, API documentation, and changelog</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Refactoring Engine</h3>
                  <p className="text-sm text-muted-foreground">Applies safe code transformations including renaming operations and file relocations</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  5
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Test Execution Engine</h3>
                  <p className="text-sm text-muted-foreground">Executes the existing test suite to verify that no regressions were introduced</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold flex-shrink-0">
                  6
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Pull Request Generation</h3>
                  <p className="text-sm text-muted-foreground">Creates a pull request containing all proposed changes for review and approval</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">
                <strong>The entire system is containerized using Docker</strong> to facilitate deployment and horizontal scaling
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
