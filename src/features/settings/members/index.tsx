import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Mail,
  Shield,
  Trash2,
  UserPlus,
  Crown,
  Eye,
  Edit3,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { DeleteConfirmHost } from "@/components/delete-confirm-dialog";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_META: Record<
  string,
  { label: string; icon: typeof Crown; color: string }
> = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  editor: {
    label: "Editor",
    icon: Edit3,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "bg-muted text-muted-foreground border-border",
  },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META.viewer;
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={`capitalize text-xs gap-1 font-medium ${meta.color}`}
    >
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}

function MembersPage() {
  const { activeWorkspaceId } = useAppStore();
  const myMembership = useQuery(
    api.members.getMyMembership,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip",
  );
  const members =
    useQuery(
      api.members.list,
      activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
    ) ?? [];
  const canManageInvites =
    myMembership?.role === "owner" || myMembership?.role === "admin";
  const canManageRoles = myMembership?.role === "owner";

  const inviteMember = useMutation(api.invites.create);
  const cancelInvite = useMutation(api.invites.cancel);
  const pendingInvites =
    useQuery(
      api.invites.listByWorkspace,
      activeWorkspaceId && canManageInvites
        ? { workspaceId: activeWorkspaceId }
        : "skip",
    ) ?? [];
  const updateRole = useMutation(api.members.updateRole);
  const removeMember = useMutation(api.members.remove);
  const deleteConfirm = useDeleteConfirm();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [search, setSearch] = useState("");

  if (!activeWorkspaceId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted mx-auto">
            <Users className="size-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Select a workspace to manage members.
          </p>
        </div>
      </div>
    );
  }

  async function handleCancelInvite(inviteId: Id<"invites">) {
    try {
      await cancelInvite({ inviteId });
      toast.success("Invite cancelled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel invite");
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    try {
      await inviteMember({
        workspaceId: activeWorkspaceId!,
        email: email.trim(),
        role,
      });
      toast.success(`Invite sent to ${email}`);
      setEmail("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to invite");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(
    memberId: Id<"members">,
    newRole: "admin" | "editor" | "viewer"
  ) {
    try {
      await updateRole({ memberId, role: newRole });
      toast.success("Role updated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update role");
    }
  }

  const filtered = members.filter((m: any) => {
    const q = search.toLowerCase();
    return (
      !q ||
      m.user?.name?.toLowerCase().includes(q) ||
      m.user?.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="size-6" />
            Members
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage who has access to this workspace. Only members have access —
            others are blocked.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {canManageInvites && (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <UserPlus className="size-4 text-primary" />
          Invite member
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as any)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviting || !email.trim()} className="gap-2">
            <UserPlus className="size-4" />
            {inviting ? "Sending…" : "Send invite"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          They&apos;ll get an email with a link and see the invite in-app when signed
          in with that email. Invites expire after 7 days.
        </p>
      </div>
      )}

      {canManageInvites && pendingInvites.length > 0 && (
        <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
          <h2 className="text-sm font-semibold">Pending invitations</h2>
          <ul className="space-y-2">
            {pendingInvites.map((inv) => (
              <li
                key={inv._id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {inv.role} · expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => void handleCancelInvite(inv._id)}
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by name, email or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Members Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12"></TableHead>
              <TableHead>Member</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              {canManageRoles && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="space-y-2">
                    <Users className="size-8 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {search ? "No members match your search." : "No members yet. Invite someone above."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m: any) => {
                const name = m.user?.name ?? "Unknown User";
                const email = m.user?.email ?? "";
                const joinedDate = m.joinedAt
                  ? new Date(m.joinedAt).toLocaleDateString()
                  : "—";

                return (
                  <TableRow key={m._id} className="group">
                    <TableCell>
                      <Avatar className="size-9">
                        <AvatarImage src={m.user?.profile?.avatarUrl} />
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
                      <RoleBadge role={m.role} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{joinedDate}</span>
                    </TableCell>
                    {canManageRoles && (
                    <TableCell className="text-right">
                      {m.role === "owner" ? (
                        <span className="text-xs text-muted-foreground pr-2">
                          Owner
                        </span>
                      ) : canManageRoles ? (
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={m.role}
                            onValueChange={(v) => handleRoleChange(m._id, v as any)}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                            onClick={() =>
                              deleteConfirm.request({
                                title: "Remove from workspace?",
                                description:
                                  "They will lose access to every project in this workspace immediately.",
                                itemName: name,
                                confirmLabel: "Remove member",
                                onConfirm: async () => {
                                  try {
                                    await removeMember({ memberId: m._id });
                                    toast.success(`${name} removed`);
                                  } catch (err: unknown) {
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to remove member",
                                    );
                                    throw err;
                                  }
                                },
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground pr-2">
                          —
                        </span>
                      )}
                    </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Access note */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 text-sm text-blue-700 dark:text-blue-300">
        <strong>Access control:</strong> Only users listed above have access to this workspace. Users not added as members cannot see or access any workspace data.
      </div>

      <DeleteConfirmHost {...deleteConfirm} />
    </div>
  );
}

export default MembersPage;
