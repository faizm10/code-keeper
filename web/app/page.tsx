import Hero from "@/components/sections/hero/default";
import Screenshot from "@/components/ui/screenshot";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import Github from "@/components/logos/github";
import { redirect } from "next/navigation";
import TrustedBy from "@/components/sections/trusted-by";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { CodeKeeperBentoGrid } from "@/components/code-keeper-bento-grid";

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

      {/* Trusted By Section */}
      {/* <TrustedBy /> */}

      

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
