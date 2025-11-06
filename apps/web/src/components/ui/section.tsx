import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
}

export function Section({ children, className }: SectionProps) {
  return (
    <section className={cn("relative w-full py-16 sm:py-24 md:py-32", className)}>
      {children}
    </section>
  );
}

