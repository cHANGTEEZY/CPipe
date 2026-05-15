import { cn } from "@/lib/utils";

const roleStyles: Record<string, string> = {
  Admin: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  Editor:
    "bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
  Viewer:
    "bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  Moderator:
    "bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  Contributor:
    "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
};

const statusStyles: Record<string, string> = {
  Active:
    "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  Inactive:
    "bg-gray-500/10 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400",
  Pending:
    "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
};

export function Badge({
  label,
  variant,
}: {
  label: string;
  variant: "role" | "status";
}) {
  const styles = variant === "role" ? roleStyles : statusStyles;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        styles[label] ?? "",
      )}
    >
      {label}
    </span>
  );
}
