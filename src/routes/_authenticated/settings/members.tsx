import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Mail, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/settings/members")({
  component: MembersPage,
});

function MembersPage() {
  const { activeWorkspaceId } = useAppStore();
  const members = useQuery(
    api.members.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? [];
  const inviteMember = useMutation(api.members.invite);
  const updateRole = useMutation(api.members.updateRole);
  const removeMember = useMutation(api.members.remove);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);

  if (!activeWorkspaceId) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Select a workspace first.
      </div>
    );
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    try {
      await inviteMember({ workspaceId: activeWorkspaceId!, email: email.trim(), role });
      toast.success(`Invite sent to ${email}`);
      setEmail("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to invite");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: Id<"members">, newRole: "admin" | "editor" | "viewer") {
    try {
      await updateRole({ memberId, role: newRole });
      toast.success("Role updated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update role");
    }
  }

  async function handleRemove(memberId: Id<"members">, name: string) {
    try {
      await removeMember({ memberId });
      toast.success(`${name} removed`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove member");
    }
  }

  const ROLE_COLOR: Record<string, string> = {
    owner: "bg-amber-500/10 text-amber-600",
    admin: "bg-purple-500/10 text-purple-600",
    editor: "bg-blue-500/10 text-blue-600",
    viewer: "bg-muted text-muted-foreground",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="size-6" /> Members
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage who has access to this workspace.
        </p>
      </div>

      {/* Invite form */}
      <div className="rounded-xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Mail className="size-4" /> Invite member
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-48"
            required
          />
          <Select value={role} onValueChange={(v) => setRole(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviting || !email.trim()}>
            {inviting ? "Inviting…" : "Invite"}
          </Button>
        </form>
      </div>

      {/* Member list */}
      <div className="rounded-xl border divide-y">
        {members.map((m: any) => (
          <div key={m._id} className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {m.user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.user?.name ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground truncate">{m.user?.email}</p>
            </div>
            <Badge className={`capitalize text-xs ${ROLE_COLOR[m.role]}`} variant="secondary">
              <Shield className="size-3 mr-1" />
              {m.role}
            </Badge>
            {m.role !== "owner" && (
              <>
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
                  className="size-8 hover:text-destructive"
                  onClick={() => handleRemove(m._id, m.user?.name ?? "User")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
