import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact - Code Keeper",
  description: "Get in touch with the team behind Code Keeper.",
};

export default function ContactPage() {
  const email = "faizmustansar10@gmail.com";

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
          <Badge variant="outline" className="gap-2 px-3 py-1 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            We’d love to hear from you
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Let’s talk about Code Keeper</h1>
          <p className="text-lg text-muted-foreground">
            Whether you’re curious about the roadmap, want to explore a partnership, or just need a hand getting set up, reach out any time. We read
            every message we receive.
          </p>
          <div className="flex items-center gap-3">
            <Button asChild size="lg">
              <Link href={`mailto:${email}`} className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email us
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">{email}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-sm leading-relaxed text-muted-foreground sm:px-6 lg:px-8">
        <p>
          I’m Faiz Mustansar, the builder behind Code Keeper. The easiest way to get in touch is through email—I personally respond to messages, usually
          within one business day. If I’m heads-down on a release, it might take a little longer, but you’ll always hear back.
        </p>
        <p>
          When you reach out, feel free to include as much context as you like—your current tooling, the size of your repos, or the maintenance challenges
          you face. The more detail you share, the faster I can point you in the right direction or schedule a deeper conversation.
        </p>
        <p>
          Code Keeper is evolving quickly, and the best feature ideas usually come from the teams I talk to. Even if you’re just brainstorming what a
          healthier development workflow could look like, I’m happy to swap notes.
        </p>
        <p>
          Looking forward to hearing from you,
          <br />
          Faiz
        </p>
      </section>
    </div>
  );
}

