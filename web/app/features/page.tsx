import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/sections/navbar/default";
import FooterSection from "@/components/sections/footer/default";
import Navigation from "@/components/ui/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Features - Code Keeper",
  description: "Explore how Code Keeper keeps your repositories organised, documented, and production-ready.",
};

export default async function FeaturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const navbarActions = user
    ? [{ text: "Dashboard", href: "/dashboard", isButton: true, variant: "default" as const }]
    : [
        { text: "Sign in", href: "/auth/login", isButton: false as const },
        {
          text: "Get Started",
          href: "/auth/signup",
          isButton: true as const,
          variant: "default" as const,
        },
      ];

  const primaryCta = user ? { href: "/dashboard", label: "Open dashboard" } : { href: "/auth/signup", label: "Start free trial" };
  const secondaryCta = user ? { href: "/docs", label: "View documentation" } : { href: "/auth/login", label: "Sign in" };

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
        actions={navbarActions}
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
                description: "Understand the endpoints that power Code Keeper integrations.",
              },
              {
                title: "Guides",
                href: "/docs/guides",
                description: "Deep dives into workflow automation and best practices.",
              },
              {
                title: "Web App Guide",
                href: "/docs/web",
                description: "Explore the Code Keeper web experience and configuration.",
              },
            ]}
            logo={
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                CK
              </div>
            }
            logoTitle="Code Keeper"
            logoDescription="Your autonomous maintenance layer for repositories and documentation."
            logoHref="/"
            introItems={[
              {
                title: "Changelog",
                href: "/changelog",
                description: "See what we shipped recently and what’s next.",
              },
              {
                title: "Privacy",
                href: "/privacy",
                description: "Understand how we handle and protect your data.",
              },
              {
                title: "Contact",
                href: "/contact",
                description: "Talk to us about enterprise rollouts or partnerships.",
              },
            ]}
          />
        }
        showNavigation
      />

      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-background via-background to-muted/20">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <Badge variant="outline" className="gap-2 px-3 py-1 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                Field notes from the Code Keeper team
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                How Code Keeper quietly maintains your repos so your team can ship faster
              </h1>
              <p className="text-lg text-muted-foreground">
                We built Code Keeper because every engineering team we worked with shared the same pain: documentation lagged, refactors slipped,
                and architecture guidelines lived in forgotten wiki pages. Here’s a behind-the-scenes look at how we turned those headaches into an autonomous maintenance layer.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={primaryCta.href} className="inline-flex items-center gap-2">
                    {primaryCta.label}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <article className="mx-auto max-w-4xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
          <section className="space-y-6">
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              I used to think documentation and cleanup would magically happen if I just pushed harder on feature delivery. The reality: nobody has time
              to tidy the repo after a sprint. That’s why I built Code Keeper—to act like the student in group projects who actually reads the rubric and finishes the boring parts before the deadline.
            </div>
            <p className="text-muted-foreground">
              Instead of waiting for the mythical “documentation day”, Code Keeper watches every commit. When someone merges a feature branch, it writes
              the updates, lines up a refactor plan, and assembles a review-ready pull request. I still read through the changes, but I’m no longer
              starting from a blank page—or worse, letting things slide.
            </p>
            <p className="text-muted-foreground">
              The best part for me is how human it feels. Code Keeper doesn’t dump walls of text. It summarises the intent behind the code, adds pointers
              to relevant files, and highlights potential risks. It’s like a teammate who actually stayed awake during stand-up and remembered everything we promised to do.
            </p>
          </section>

          <section className="space-y-6">
            <p className="text-base font-semibold uppercase tracking-wide text-primary">
              How I keep the repo honest without burning weekends
            </p>
            <p className="text-muted-foreground">
              First, I let Code Keeper shadow my workflow. On every push, it runs a semantic diff, figures out what changed, and drafts documentation in
              my voice. If the architecture drifts, it calls it out with context, not blame. When something looks sketchy, it flags the risk and nudges me
              to double-check before the rollout meeting.
            </p>
            <p className="text-muted-foreground">
              I rely on four habits it never forgets: it rewrites README snippets when APIs move, it stages safe refactors instead of TODO comments, it
              watches folder structure the way my old tech lead did, and it keeps a running knowledge base of why things changed. Those habits sound small,
              but together they mean nobody on the team has to guess what happened last sprint.
            </p>
            <p className="text-muted-foreground">
              Every Friday, I skim the digest PR it opens. The doc updates are waiting, the architectural map is fresh, and the refactor suggestions are
              lined up behind feature work. I hit review, add my thoughts, and merge. That ritual alone feels like levelling up from cramming work
              Saturday night to finishing homework during study hall.
            </p>
          </section>

          <section className="space-y-6">
            <p className="text-base font-semibold uppercase tracking-wide text-primary">
              A walk-through of one typical change
            </p>
            <p className="text-muted-foreground">
              Imagine our team ships a new onboarding flow. Code Keeper catches the commit, scans related files, and realises the API surface grew. It
              rewrites the relevant section in the docs, links to the new module, and drafts a short architecture note explaining why we added another
              dependency. Then it looks for brittle spots—a shared util that deserves cleanup—and prepares a refactor branch I can opt into.
            </p>
            <p className="text-muted-foreground">
              While that’s happening, it runs the test suite in a clean environment and collects the artefacts. If something flakes, it points me straight
              at the failing spec instead of leaving me to dig through logs. When the pull request lands in my inbox, everything is packaged: docs,
              refactors, architecture notes, and validation results. My job is just to confirm it feels right for the team.
            </p>
            <p className="text-muted-foreground">
              That cycle repeats for every feature. Nothing heroic, just steady, reliable maintenance that keeps the repo honest. It reminds me of updating
              a lab report the same day we ran the experiment—far easier than trying to reconstruct it a week later during exams.
            </p>
          </section>

          <section className="space-y-6">
            <p className="text-base font-semibold uppercase tracking-wide text-primary">
              Staying compliant without feeling like a bureaucrat
            </p>
            <p className="text-muted-foreground">
              I know security and compliance can sound like grown-up problems, but Code Keeper handles them with the same low-key energy. Every automated
              change ships with a paper trail: what triggered it, which files moved, who reviewed it, and how tests passed. When I need to prove we’re
              following process, the evidence is already there—no all-nighters building reports.
            </p>
            <p className="text-muted-foreground">
              Because it never pushes directly, there’s always a human checkpoint. That keeps leadership calm and gives auditors something tangible to read.
              They can see decisions, comments, and the exact moment we approved a refactor. Honestly, it feels like showing your math on a calculus test—
              tedious when you do it solo, effortless when someone else handles the setup.
            </p>
          </section>

          <section className="space-y-6">
            <p className="text-base font-semibold uppercase tracking-wide text-primary">
              Bringing Code Keeper into your team
            </p>
            <p className="text-muted-foreground">
              If you’re curious, the on-ramp is straightforward. Connect your GitHub account, pick a few repositories, and let Code Keeper run alongside
              your existing process for a sprint. Watch the pull requests it opens. Edit the docs it writes. Reject the refactors you don’t need. The goal
              isn’t to replace your judgment—it’s to free your headspace so you can use that judgment on work that moves the product forward.
            </p>
            <p className="text-muted-foreground">
              After a couple of weeks, most teams I talk to wonder how they tolerated the old way. They cancel their recurring “documentation review”
              meetings, retire dusty internal wikis, and stop chasing folks for architecture updates. The repo feels lighter, safer, more honest. To me,
              that’s the real feature: a calmer engineering culture because the maintenance chores are finally handled.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </section>
        </article>
      </main>

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
              { text: "Guides", href: "/docs/guides" },
              { text: "API Reference", href: "/docs/api" },
              { text: "Web App Guide", href: "/docs/web" },
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
        showModeToggle
      />
    </div>
  );
}

