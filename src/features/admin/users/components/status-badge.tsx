import { Badge } from "@/components/ui/badge";

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-700 border-red-200",
  },
  suspended: {
    label: "Suspended",
    color: "bg-orange-500/10 text-orange-700 border-orange-200",
  },
  banned: {
    label: "Banned",
    color: "bg-rose-500/10 text-rose-700 border-rose-200",
  },
};

export function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "approved";
  const meta = STATUS_META[s] ?? STATUS_META.approved;
  return (
    <Badge variant="outline" className={`text-xs font-medium ${meta.color}`}>
      {meta.label}
    </Badge>
  );
}
