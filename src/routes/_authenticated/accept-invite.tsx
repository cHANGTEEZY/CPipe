import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import type { Id } from "@convex/_generated/dataModel";

type AcceptInviteSearch = {
  token?: string;
};

export const Route = createFileRoute("/_authenticated/accept-invite")({
  validateSearch: (search: Record<string, unknown>): AcceptInviteSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const acceptInvite = useMutation(api.invites.accept);
  const { setActiveWorkspace } = useAppStore();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing invite token.");
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const workspaceId = await acceptInvite({ token });
        if (cancelled) return;
        setActiveWorkspace(workspaceId as Id<"workspaces">);
        toast.success("You've joined the workspace!");
        navigate({ to: "/" });
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to accept invite";
        setErrorMessage(message);
        setStatus("error");
        toast.error(message);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token, acceptInvite, navigate, setActiveWorkspace]);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="text-center space-y-3">
          <Loader2 className="size-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Accepting invitation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-sm text-destructive">{errorMessage}</p>
        <p className="text-xs text-muted-foreground">
          Make sure you are signed in with the email address that received the
          invite. You can also accept invites from the banner at the top of the
          app after signing in.
        </p>
      </div>
    </div>
  );
}
