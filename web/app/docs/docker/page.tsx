import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { getDocBySlug, extractHeadings } from "@/lib/docs";
import { Markdown } from "@/components/ui/markdown";
import ScrollSpyContainer from "../scroll-spy-container";

export const metadata: Metadata = {
  title: "Docker Setup - Code Keeper",
  description: "Docker deployment guide for Code Keeper.",
};

export default function DockerDocsPage() {
  const doc = getDocBySlug('docker')
  
  if (!doc) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-lg text-muted-foreground">Documentation not found.</p>
          </div>
        </main>
      </div>
    )
  }

  const headings = extractHeadings(doc.content)

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-72 shrink-0 overflow-hidden border-r border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground md:block">
        <ScrollSpyContainer 
          sections={headings.map(({ id, title }) => ({ id, title }))} 
          className="space-y-6" 
        />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-border bg-gradient-to-b from-background via-background to-muted/20">
          <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
            <Badge variant="outline" className="gap-2 px-3 py-1 text-sm">
              Documentation
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{doc.metadata.title}</h1>
            {doc.metadata.description && (
              <p className="text-lg text-muted-foreground">
                {doc.metadata.description}
              </p>
            )}
          </div>
        </header>

        <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown 
              content={doc.content}
              className="[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-foreground
                        [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-foreground
                        [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p]:mb-4"
            />
          </div>
        </article>
      </main>
    </div>
  );
}

