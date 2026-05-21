import type { ReactNode } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarsShell } from "@/components/home/stars-shell";

type EmptyTestimonialVariant = "workspace" | "project";

const COPY: Record<
  EmptyTestimonialVariant,
  { quote: string; role: string; team: string }
> = {
  workspace: {
    quote:
      "We stopped juggling spreadsheets the day we opened one workspace. Every pipeline finally had a home.",
    role: "Operations lead",
    team: "Teams on CPipeLine",
  },
  project: {
    quote:
      "Our first kanban card felt small — until the board filled with momentum. Empty states do not last long here.",
    role: "Delivery manager",
    team: "Teams on CPipeLine",
  },
};

interface EmptyTestimonialProps {
  variant: EmptyTestimonialVariant;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function EmptyTestimonial({
  variant,
  title,
  description,
  children,
  footer,
  className,
}: EmptyTestimonialProps) {
  const { quote, role, team } = COPY[variant];

  return (
    <StarsShell className={cn("relative", className)}>
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-10 text-center">
        <figure className="relative w-full space-y-5 px-2">
          <Quote
            className="mx-auto size-9 text-primary/35"
            aria-hidden
          />
          <blockquote className="text-balance text-lg font-medium leading-relaxed tracking-tight text-foreground/90 sm:text-xl">
            <span className="text-primary/80">&ldquo;</span>
            {quote}
            <span className="text-primary/80">&rdquo;</span>
          </blockquote>
          <figcaption className="flex items-center justify-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-xs font-bold text-primary"
              aria-hidden
            >
              CP
            </span>
            <div className="text-left text-sm leading-snug">
              <p className="font-medium text-foreground">{role}</p>
              <p className="text-muted-foreground">{team}</p>
            </div>
          </figcaption>
        </figure>

        <div className="flex w-full max-w-md flex-col items-center gap-6 border-t border-border/40 pt-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h2>
            {description && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>

        {footer}
      </div>
    </StarsShell>
  );
}
