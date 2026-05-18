import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

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
  const s = status ?? "approved";
  const meta = STATUS_META[s] ?? STATUS_META.approved;
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

  const flatUsers = useMemo(() => {
    return users.map((u: any) => ({
      ...u,
      displayName: u.profile?.displayName ?? u.name ?? "Unknown",
      status: u.profile?.status ?? "approved",
      isSuperAdmin: u.profile?.superAdmin === true,
      avatarUrl: u.profile?.avatarUrl,
    }));
  }, [users]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "displayName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage src={u.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials(u.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{u.displayName}</p>
              <p className="text-xs text-muted-foreground sm:hidden">{u.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => {
        return <p className="text-sm text-muted-foreground">{row.original.email}</p>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        return <StatusBadge status={row.original.status} />;
      },
      filterFn: (row, _id, value) => {
        return value.includes(row.original.status);
      },
    },
    {
      accessorKey: "_creationTime",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
      cell: ({ row }) => {
        const joinedDate = row.original._creationTime
          ? new Date(row.original._creationTime).toLocaleDateString()
          : "—";
        return <span className="text-xs text-muted-foreground">{joinedDate}</span>;
      },
    },
    {
      accessorKey: "isSuperAdmin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const isSuperAdmin = row.original.isSuperAdmin;
        return isSuperAdmin ? (
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            <Shield className="size-3 mr-1" />
            Super Admin
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const u = row.original;
        const isLoading = actionLoading === u._id;

        if (u.isSuperAdmin) {
          return <span className="text-xs text-muted-foreground pr-2 flex justify-end">Protected</span>;
        }

        return (
          <div className="flex items-center justify-end gap-1">
            {/* Quick approve/reject for pending */}
            {u.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  disabled={isLoading}
                  onClick={() => handleStatusChange(u._id, "approved", u.displayName)}
                >
                  <Check className="size-3" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs border-red-200 text-red-700 hover:bg-red-50"
                  disabled={isLoading}
                  onClick={() => handleStatusChange(u._id, "rejected", u.displayName)}
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
                {u.status !== "approved" && (
                  <DropdownMenuItem
                    className="gap-2 text-emerald-600"
                    onClick={() => handleStatusChange(u._id, "approved", u.displayName)}
                  >
                    <Check className="size-4" />
                    Approve
                  </DropdownMenuItem>
                )}
                {u.status !== "rejected" && (
                  <DropdownMenuItem
                    className="gap-2 text-red-600"
                    onClick={() => handleStatusChange(u._id, "rejected", u.displayName)}
                  >
                    <X className="size-4" />
                    Reject
                  </DropdownMenuItem>
                )}
                {u.status !== "suspended" && (
                  <DropdownMenuItem
                    className="gap-2 text-orange-600"
                    onClick={() => handleStatusChange(u._id, "suspended", u.displayName)}
                  >
                    <ShieldOff className="size-4" />
                    Suspend
                  </DropdownMenuItem>
                )}
                {u.status !== "banned" && (
                  <DropdownMenuItem
                    className="gap-2 text-rose-600"
                    onClick={() => handleStatusChange(u._id, "banned", u.displayName)}
                  >
                    <Ban className="size-4" />
                    Ban
                  </DropdownMenuItem>
                )}
                {u.status !== "pending" && (
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => handleStatusChange(u._id, "pending", u.displayName)}
                  >
                    Reset to pending
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={() => handleDelete(u._id, u.displayName)}
                >
                  <Trash2 className="size-4" />
                  Delete user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [actionLoading]);

  const facetedFilters = [
    {
      column: "status",
      title: "Status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
        { label: "Suspended", value: "suspended" },
        { label: "Banned", value: "banned" },
      ],
    },
  ];

  const pendingCount = flatUsers.filter((u) => u.status === "pending").length;

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
            View all platform users. Suspend, ban, or delete accounts as needed.
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

      <DataTable
        columns={columns}
        data={flatUsers}
        searchKey={["displayName", "email"]}
        searchPlaceholder="Search users..."
        facetedFilters={facetedFilters}
      />
    </div>
  );
}
