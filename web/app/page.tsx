import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, Code2, FileText, GitPullRequest, Shield, Sparkles, CheckCircle2, Github } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

type HomeSearchParams = {
  code?: string
  state?: string
  next?: string
}

type HomeProps = {
  searchParams: Promise<HomeSearchParams>
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams

  // Handle OAuth callback - redirect to auth/callback if code parameter is present
  if (params?.code) {
    const query = new URLSearchParams()
    query.set("code", params.code)
    if (params.state) {
      query.set("state", params.state)
    }
    if (params.next) {
      query.set("next", params.next)
    }
    redirect(`/auth/callback?${query.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      {/* <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Code2 className="h-6 w-6" />
              <span className="font-semibold text-xl">Code Keeper</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
              <Button size="sm">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav> */}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="h-3 w-3 mr-1" />
              Automatically updates docs after every PR
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
              Automated Code Maintenance for Modern Teams
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto leading-relaxed">
              Keep your repositories well-documented and architecturally consistent with AI-powered pull request
              analysis. Focus on building features while Code Keeper handles maintenance.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/auth/login">
                  <Github className="mr-2 h-5 w-5" />
                  Connect GitHub
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 bg-transparent">
                View Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">Free trial • No credit card required • 5 minute setup</p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
              <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">Code Keeper Dashboard</span>
              </div>
              <div className="p-8">
                <img src="/dashboard.svg" alt="Code Keeper Dashboard" className="w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              Intelligent Code Maintenance on Autopilot
            </h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              AI-powered analysis that understands your code contextually, not just through pattern matching
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <GitPullRequest className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart PR Analysis</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI analyzes every pull request to detect meaningful changes: new endpoints, functions, database schema
                changes, and infrastructure updates.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Documentation Sync</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatically tracks documentation obligations and suggests updates when code changes. Gentle reminders
                keep docs in perfect sync.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Context-Aware Comments</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get human-friendly feedback that reads like it's from a helpful senior engineer, not a bot. Perfect for
                onboarding new developers.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe by Default</h3>
              <p className="text-muted-foreground leading-relaxed">
                Never commits directly to main. All suggestions are proposed through pull requests, maintaining your
                team's review workflow.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Repository Health</h3>
              <p className="text-muted-foreground leading-relaxed">
                Monitor documentation coverage, track file types, and analyze repository activity to prevent technical
                debt from accumulating.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">GitHub Integration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seamless GitHub OAuth authentication with webhook support for real-time PR monitoring. Set up in
                minutes, not hours.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">How Code Keeper Works</h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              Powered by Google Gemini 2.5 Flash for contextual understanding
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyze Changes</h3>
              <p className="text-muted-foreground leading-relaxed">
                When a PR is opened, Code Keeper analyzes all changed files, classifications, and repository structure
                using AI to understand context.
              </p>
            </div>

            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Detect Events</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI detects meaningful events like new endpoints, public functions, database schema changes, and
                environment variables that need documentation.
              </p>
            </div>

            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Provide Feedback</h3>
              <p className="text-muted-foreground leading-relaxed">
                Generate intelligent PR comments that explain changes in developer-friendly language, highlight
                important details, and suggest documentation updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-balance">Stop Fighting Technical Debt</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-destructive text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-medium">Documentation falls behind code changes</p>
                    <p className="text-sm text-muted-foreground">
                      Manual updates get forgotten in fast-paced development
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-destructive text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-medium">New developers struggle with PRs</p>
                    <p className="text-sm text-muted-foreground">
                      Understanding complex changes takes hours of investigation
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-destructive text-sm">✕</span>
                  </div>
                  <div>
                    <p className="font-medium">Architecture drifts from design</p>
                    <p className="text-sm text-muted-foreground">Technical debt accumulates silently over time</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold mb-6 text-balance">Maintain Quality Automatically</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Docs stay synchronized automatically</p>
                    <p className="text-sm text-muted-foreground">
                      AI detects changes and suggests documentation updates in real-time
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Onboard developers instantly</p>
                    <p className="text-sm text-muted-foreground">
                      Every PR includes a guided tour explaining what changed and why
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Prevent debt before it happens</p>
                    <p className="text-sm text-muted-foreground">Catch documentation drift and inconsistencies early</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Trusted by development teams</p>
            <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
              <a
                href="https://uoguelph.courses/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-100 transition-opacity duration-200"
              >
                <Image
                  src="/Test3.png"
                  alt="uoguelph.courses logo"
                  width={120}
                  height={60}
                  className="max-h-12 md:max-h-16 w-auto object-contain"
                />
                <span className="text-2xl font-semibold">uoguelph.courses</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Ready to Automate Your Code Maintenance?</h2>
          <p className="text-xl mb-8 opacity-90 text-balance leading-relaxed">
            Join development teams keeping their repositories well-documented and maintainable. Set up in 5 minutes with
            your GitHub account.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" variant="secondary" className="h-12 px-8" asChild>
              <Link href="/auth/login">
                <Github className="mr-2 h-5 w-5" />
                Get Started Free
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 bg-transparent hover:bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm mt-6 opacity-75">Free trial • No credit card required • Cancel anytime</p>
        </div>
      </section>
    </div>
  )
}
