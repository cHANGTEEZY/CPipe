import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { formatTagLabel } from "@/lib/tag-utils";
import type { Id } from "@convex/_generated/dataModel";

export function WorkspaceInviteBanner() {
  const pending = useQuery(api.invites.listMine) ?? [];
  const acceptInvite = useMutation(api.invites.accept);
  const { setActiveWorkspace } = useAppStore();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = pending.filter((i) => !dismissed.includes(i._id));
  if (visible.length === 0) return null;

  async function handleAccept(
    token: string,
    workspaceId: string,
    workspaceName: string,
  ) {
    setAcceptingId(token);
    try {
      await acceptInvite({ token });
      setActiveWorkspace(workspaceId as Id<"workspaces">);
      toast.success(`Joined ${workspaceName}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <div className="mb-4 space-y-2">
      {visible.map((invite) => (
        <div
          key={invite._id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Invitation to{" "}
                <span className="text-primary">
                  {invite.workspace?.name ?? "a workspace"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {invite.inviterName} invited you as{" "}
                {formatTagLabel(invite.role)} · expires{" "}
                {new Date(invite.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              disabled={acceptingId === invite.token}
              onClick={() =>
                void handleAccept(
                  invite.token,
                  invite.workspaceId,
                  invite.workspace?.name ?? "workspace",
                )
              }
            >
              {acceptingId === invite.token ? "Joining…" : "Accept"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="size-8 px-0"
              onClick={() => setDismissed((d) => [...d, invite._id])}
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
