import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import {
  FlipButton,
  FlipButtonFront,
  FlipButtonBack,
} from "@/components/animate-ui/primitives/buttons/flip";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <FlipButton
      onClick={toggle}
      from="top"
      aria-label="Toggle theme"
      className={cn(
        "cursor-pointer",
        "h-9 rounded-full px-3",
        "border border-input bg-background shadow-xs",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
      )}
    >
      <FlipButtonFront
        className={cn(
          "gap-2",
          theme === "light" ? "text-amber-500" : "text-sky-400",
        )}
      >
        {theme === "light" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
        <span className="text-xs font-medium">
          {theme === "light" ? "Light" : "Dark"}
        </span>
      </FlipButtonFront>
      <FlipButtonBack
        className={cn(
          "gap-2",
          theme === "light" ? "text-sky-400" : "text-amber-500",
        )}
      >
        {theme === "light" ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
        <span className="text-xs font-medium">
          {theme === "light" ? "Dark" : "Light"}
        </span>
      </FlipButtonBack>
    </FlipButton>
  );
}
