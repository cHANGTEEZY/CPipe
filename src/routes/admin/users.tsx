import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Check,
  X,
  MoreHorizontal,
  Trash2,
  Shield,
  ShieldOff,
  Ban,
  Search,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "suspended" | "banned";

const STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-700 border-red-200" },
  suspended: { label: "Suspended", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  banned: { label: "Banned", color: "bg-rose-500/10 text-rose-700 border-rose-200" },
};

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "pending";
  const meta = STATUS_META[s] ?? STATUS_META.pending;
  return (
    <Badge variant="outline" className={`text-xs font-medium ${meta.color}`}>
      {meta.label}
    </Badge>
  );
}

function initials(name: string) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AdminUsersPage() {
  const users = useQuery(api.users.listAll) ?? [];
  const updateStatus = useMutation(api.users.updateStatus);
  const deleteUser = useMutation(api.users.deleteUser);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleStatusChange(
    userId: Id<"users">,
    status: "approved" | "rejected" | "suspended" | "banned" | "pending",
    name: string
  ) {
    setActionLoading(userId);
    try {
      await updateStatus({ userId, status });
      toast.success(`${name} marked as ${status}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: Id<"users">, name: string) {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      await deleteUser({ userId });
      toast.success(`${name} deleted`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = users.filter((u: any) => {
    const status = u.profile?.status ?? "pending";
    if (statusFilter !== "all" && status !== statusFilter) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const pendingCount = users.filter(
    (u: any) => !u.profile?.status || u.profile?.status === "pending"
  ).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="size-6" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approve, reject, suspend, or ban users. Only approved users can access the app.
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1.5">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-white" />
            </span>
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40">
            <Filter className="size-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground ml-auto">
          {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12"></TableHead>
              <TableHead>User</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="hidden lg:table-cell">Super Admin</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="space-y-2">
                    <Users className="size-10 mx-auto text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {search || statusFilter !== "all"
                        ? "No users match your filters."
                        : "No users found."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u: any) => {
                const name = u.profile?.displayName ?? u.name ?? "Unknown";
                const email = u.email ?? "";
                const status = u.profile?.status ?? "pending";
                const isSuperAdmin = u.profile?.superAdmin === true;
                const isLoading = actionLoading === u._id;
                const joinedDate = u._creationTime
                  ? new Date(u._creationTime).toLocaleDateString()
                  : "—";

                return (
                  <TableRow key={u._id} className={`group ${status === "pending" ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}>
                    <TableCell>
                      <Avatar className="size-9">
                        <AvatarImage src={u.profile?.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {initials(name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{joinedDate}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {isSuperAdmin ? (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          <Shield className="size-3 mr-1" />
                          Super Admin
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSuperAdmin ? (
                        <span className="text-xs text-muted-foreground pr-2">Protected</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick approve/reject for pending */}
                          {status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                disabled={isLoading}
                                onClick={() => handleStatusChange(u._id, "approved", name)}
                              >
                                <Check className="size-3" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-xs border-red-200 text-red-700 hover:bg-red-50"
                                disabled={isLoading}
                                onClick={() => handleStatusChange(u._id, "rejected", name)}
                              >
                                <X className="size-3" />
                                Reject
                              </Button>
                            </>
                          )}

                          {/* More actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={isLoading}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {status !== "approved" && (
                                <DropdownMenuItem
                                  className="gap-2 text-emerald-600"
                                  onClick={() => handleStatusChange(u._id, "approved", name)}
                                >
                                  <Check className="size-4" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {status !== "rejected" && (
                                <DropdownMenuItem
                                  className="gap-2 text-red-600"
                                  onClick={() => handleStatusChange(u._id, "rejected", name)}
                                >
                                  <X className="size-4" />
                                  Reject
                                </DropdownMenuItem>
                              )}
                              {status !== "suspended" && (
                                <DropdownMenuItem
                                  className="gap-2 text-orange-600"
                                  onClick={() => handleStatusChange(u._id, "suspended", name)}
                                >
                                  <ShieldOff className="size-4" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {status !== "banned" && (
                                <DropdownMenuItem
                                  className="gap-2 text-rose-600"
                                  onClick={() => handleStatusChange(u._id, "banned", name)}
                                >
                                  <Ban className="size-4" />
                                  Ban
                                </DropdownMenuItem>
                              )}
                              {status !== "pending" && (
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => handleStatusChange(u._id, "pending", name)}
                                >
                                  Reset to pending
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => handleDelete(u._id, name)}
                              >
                                <Trash2 className="size-4" />
                                Delete user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
