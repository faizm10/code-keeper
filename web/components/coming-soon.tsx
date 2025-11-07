import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title?: string;
  description?: string;
  fullHeight?: boolean;
}

export default function ComingSoon({
  title = "Coming Soon",
  description = "We're working hard to bring you this feature. Check back soon!",
  fullHeight = true,
}: ComingSoonProps) {
  const containerClass = fullHeight
    ? "min-h-screen bg-background flex items-center justify-center px-4"
    : "bg-background flex items-center justify-center px-4 py-24";

  return (
    <div className={containerClass}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">{description}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="https://github.com/faizm10/code-keeper" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

