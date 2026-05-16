import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Users, UserCheck, UserX, Clock, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: number | string;
  icon: typeof Users;
  color: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const users = useQuery(api.users.listAll) ?? [];

  const totalUsers = users.length;
  const pending = users.filter((u: any) => !u.profile?.status || u.profile?.status === "pending").length;
  const approved = users.filter((u: any) => u.profile?.status === "approved").length;
  const rejected = users.filter((u: any) => u.profile?.status === "rejected").length;
  const suspended = users.filter((u: any) => u.profile?.status === "suspended").length;
  const banned = users.filter((u: any) => u.profile?.status === "banned").length;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">System Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your platform users and access management.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="bg-primary/10 text-primary"
          description="All registered accounts"
        />
        <StatCard
          title="Pending Approval"
          value={pending}
          icon={Clock}
          color="bg-amber-500/10 text-amber-600"
          description="Awaiting admin review"
        />
        <StatCard
          title="Approved"
          value={approved}
          icon={UserCheck}
          color="bg-emerald-500/10 text-emerald-600"
          description="Active platform users"
        />
        <StatCard
          title="Rejected"
          value={rejected}
          icon={UserX}
          color="bg-red-500/10 text-red-600"
          description="Access denied"
        />
        <StatCard
          title="Suspended"
          value={suspended}
          icon={TrendingUp}
          color="bg-orange-500/10 text-orange-600"
          description="Temporarily restricted"
        />
        <StatCard
          title="Banned"
          value={banned}
          icon={UserX}
          color="bg-rose-500/10 text-rose-600"
          description="Permanently blocked"
        />
      </div>

      {/* Recent pending users */}
      {pending > 0 && (
        <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm mb-2">
            <Clock className="size-4" />
            {pending} user{pending !== 1 ? "s" : ""} pending approval
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Go to the <strong>Users</strong> page to review and approve or reject pending accounts.
          </p>
        </div>
      )}
    </div>
  );
}
