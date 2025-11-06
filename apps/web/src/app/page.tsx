import Hero from "@/components/sections/hero/default";

export default function Home() {
  return (
    <main>
      <Hero
        title="Codekeeper"
        description="Automatic refactoring + documentation for your codebase. Watches your repo, updates docs, performs safe refactors, and opens PRs."
        badge={false}
        mockup={false}
        buttons={[
          {
            href: "#",
            text: "Get Started",
            variant: "default",
          },
          {
            href: "#",
            text: "View on GitHub",
            variant: "outline",
          },
        ]}
      />
    </main>
  );
}

