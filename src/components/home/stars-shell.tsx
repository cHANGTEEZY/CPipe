import type { ReactNode } from "react";
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function StarsShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { theme } = useTheme();
  const starPalette =
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
    <div className="relative -m-6 flex min-h-[calc(100svh-3.5rem)] flex-1 flex-col overflow-hidden">
      <StarsBackground
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 size-full",
          starPalette.radial,
        )}
        factor={0.04}
        speed={52}
        pointerEvents={false}
        starColor={starPalette.starColor}
      />
      <div
        className={cn(
          "relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-6 py-10",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
