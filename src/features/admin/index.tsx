import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import StatCard from "./component/StatCard";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

function AdminDashboard() {
  const users = useQuery(api.users.listAll) ?? [];

  const totalUsers = users.length;
  const approved = users.filter(
    (u: any) =>
      u.profile?.superAdmin ||
      !u.profile?.status ||
      u.profile?.status === "approved",
  ).length;
  const pending = users.filter(
    (u: any) => u.profile?.status === "pending",
  ).length;
  const rejected = users.filter(
    (u: any) => u.profile?.status === "rejected",
  ).length;
  const suspended = users.filter(
    (u: any) => u.profile?.status === "suspended",
  ).length;
  const banned = users.filter(
    (u: any) => u.profile?.status === "banned",
  ).length;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">System Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your platform users and access management.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="bg-primary/10 text-primary"
          description="All registered accounts"
        />
        <StatCard
          title="Legacy pending"
          value={pending}
          icon={Clock}
          color="bg-amber-500/10 text-amber-600"
          description="Old accounts not yet migrated"
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

      <div className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-sm">User management</h2>
          <p className="text-xs text-muted-foreground mt-1">
            View all accounts, suspend, ban, or delete users.
            {pending > 0 &&
              ` ${pending} legacy account${pending !== 1 ? "s" : ""} still marked pending.`}
          </p>
        </div>
        <Button asChild size="sm" className="gap-2 shrink-0">
          <Link to="/admin/users">
            Manage users
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default AdminDashboard;
