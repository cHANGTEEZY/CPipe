import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bootstrap-admin")({
  component: BootstrapAdminPage,
});

function BootstrapAdminPage() {
  const me = useQuery(api.users.getMe);
  const bootstrap = useMutation(api.users.bootstrapSuperAdmin);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (me?.profile?.superAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
            <Shield className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Already a Super Admin</h2>
          <p className="text-sm text-muted-foreground">You already have super admin privileges.</p>
          <Button onClick={() => navigate({ to: "/admin" })}>Go to System Admin</Button>
        </div>
      </div>
    );
  }

  async function handleBootstrap() {
    setLoading(true);
    try {
      await bootstrap();
      setDone(true);
      toast.success("You are now Super Admin!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto">
            <Check className="size-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold">Super Admin activated!</h2>
          <Button onClick={() => navigate({ to: "/admin" })}>Open System Admin</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <Shield className="size-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Bootstrap Super Admin</h2>
        <p className="text-sm text-muted-foreground">
          This makes your current account the super admin. Only works if no super admin exists yet.
        </p>
        <Button onClick={handleBootstrap} disabled={loading}>
          {loading ? "Setting up…" : "Make me Super Admin"}
        </Button>
      </div>
    </div>
  );
}
