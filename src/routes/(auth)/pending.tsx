import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, Clock, CheckCircle, XCircle, ShieldOff, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";

export const Route = createFileRoute("/(auth)/pending")({
  component: PendingPage,
});

function PendingPage() {
  const me = useQuery(api.users.getMe);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  if (me === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If approved, redirect to app
  if (me?.profile?.status === "approved" || (!me?.profile?.status && me?.profile?.superAdmin)) {
    return <Navigate to="/" replace />;
  }

  const status = me?.profile?.status ?? "pending";

  const CONFIG = {
    pending: {
      icon: Clock,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
      title: "Account pending approval",
      message:
        "Your account is under review by our admin team. You'll have access once approved. This usually takes less than 24 hours.",
    },
    rejected: {
      icon: XCircle,
      iconClass: "text-red-500",
      bgClass: "bg-red-500/10",
      title: "Account not approved",
      message:
        me?.profile?.rejectionReason ??
        "Your account application was not approved. Please contact support for more information.",
    },
    suspended: {
      icon: ShieldOff,
      iconClass: "text-orange-500",
      bgClass: "bg-orange-500/10",
      title: "Account suspended",
      message:
        "Your account has been temporarily suspended. Please contact support for assistance.",
    },
    banned: {
      icon: Ban,
      iconClass: "text-rose-500",
      bgClass: "bg-rose-500/10",
      title: "Account banned",
      message: "Your account has been permanently banned from this platform.",
    },
  } as const;

  const cfg = CONFIG[status as keyof typeof CONFIG] ?? CONFIG.pending;
  const Icon = cfg.icon;

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md space-y-6">
        <div className={`flex size-20 items-center justify-center rounded-full ${cfg.bgClass} mx-auto`}>
          <Icon className={`size-10 ${cfg.iconClass}`} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{cfg.title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{cfg.message}</p>
        </div>
        <div className="space-y-2">
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
