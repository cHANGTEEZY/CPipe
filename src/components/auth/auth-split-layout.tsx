import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { useTheme } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const BRAND_NAME = "CPipeLine";

interface AuthSplitLayoutProps {
  pathname: string;
  children: React.ReactNode;
}

function authPromoCopy(pathname: string): {
  headline: string;
  ctaHref: "/login" | "/register";
  ctaLabel: string;
} {
  if (pathname.startsWith("/register")) {
    return {
      headline: "Modern operations tooling for teams that ship fast.",
      ctaHref: "/login",
      ctaLabel: "Sign in",
    };
  }
  if (pathname.startsWith("/reset-password")) {
    return {
      headline: "Secure flows for account recovery, without the friction.",
      ctaHref: "/login",
      ctaLabel: "Back to sign in",
    };
  }
  if (pathname.startsWith("/otp")) {
    return {
      headline: "An extra layer of security protects your dashboard.",
      ctaHref: "/login",
      ctaLabel: "Back to sign in",
    };
  }
  return {
    headline: "Powerful pipelines, clear insights, effortless control.",
    ctaHref: "/register",
    ctaLabel: "Join now",
  };
}

export function AuthSplitLayout({ pathname, children }: AuthSplitLayoutProps) {
  const { theme } = useTheme();
  const promo = authPromoCopy(pathname);

  /** Light UI uses a near-white radial; slate stars need darker paint. Dark mode uses luminous dots. */
  const heroStarPalette =
    theme === "dark"
      ? {
          starColor: "rgb(226 232 240 / 0.5)",
          radial:
            "bg-[radial-gradient(ellipse_at_bottom,var(--muted),var(--background))]",
        }
      : {
          starColor: "rgb(51 65 85 / 0.42)",
          radial:
            "bg-[radial-gradient(ellipse_at_bottom,color-mix(in_oklch,var(--foreground)_14%,var(--muted)),var(--background))]",
        };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="grid min-h-dvh lg:grid-cols-2">
        {/* Left (lg): stars promo */}
        <div className="relative isolate hidden min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
          <StarsBackground
            aria-hidden
            className={cn(
              "absolute inset-0 z-0 min-h-[100dvh] lg:min-h-0",
              "touch-manipulation select-none",
              heroStarPalette.radial,
            )}
            factor={0.04}
            speed={52}
            pointerEvents
            starColor={heroStarPalette.starColor}
          />
          <div className="pointer-events-none relative z-[1] flex flex-1 flex-col justify-center px-8 py-14 xl:p-16">
            <div className="pointer-events-none mx-auto flex w-full max-w-[28rem] flex-col gap-8 text-center">
              <div className="pointer-events-none space-y-4">
                <p className="text-balance text-3xl font-semibold tracking-tight text-foreground xl:text-[2rem] xl:leading-tight">
                  {promo.headline}
                </p>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  Built for operators who live in pipelines every day — clear,
                  responsive, and on brand.
                </p>
              </div>
              <div className="pointer-events-auto flex justify-center">
                <Button
                  asChild
                  className="rounded-full px-8 shadow-md shadow-primary/15"
                >
                  <Link to={promo.ctaHref}>{promo.ctaLabel}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right (lg): auth form */}
        <div className="flex flex-col px-6 pb-10 pt-6 sm:px-10 lg:px-14 xl:px-16">
          <header className="flex shrink-0 items-center justify-between gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2.5 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                <svg
                  className="size-5 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              </div>
              <span className="font-semibold tracking-tight text-lg">{BRAND_NAME}</span>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    English
                    <ChevronDown className="size-3 opacity-70" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[8rem]">
                  <DropdownMenuItem
                    disabled
                    className="text-muted-foreground"
                  >
                    English (default)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center pt-12 pb-8 lg:pt-16">
            <div className="mx-auto w-full max-w-[400px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative py-6">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/60" />
      <span className="relative mx-auto block w-fit bg-background px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        or
      </span>
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 shrink-0", className)}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
