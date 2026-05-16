import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  showText?: boolean;
}

export function Logo({ className, iconOnly = false, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform hover:scale-105">
        <Activity className="size-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      {!iconOnly && showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight leading-none text-foreground">
            CPipeLine
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mt-0.5">
            Operations
          </span>
        </div>
      )}
    </div>
  );
}
