import { useLogout } from "@/api";
import { ConfirmAlertDialog } from "@/components/confirm-alert-dialog";
import { Button } from "@/components/animate-ui/components/buttons/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type DangerZoneSectionProps = {
  idPrefix: string;
};

const actionButtonClass =
  "h-10 min-w-[10.5rem] justify-center px-4 sm:w-auto sm:min-w-[11rem] cursor-pointer";

export function DangerZoneSection({ idPrefix }: DangerZoneSectionProps) {
  const navigate = useNavigate();
  const headingId = `${idPrefix}-danger-heading`;
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        void navigate({ to: "/login" });
      },
    });
  };

  const handleDeleteConfirm = () => {
    setDeleteOpen(false);
    toast.error("Account deletion is not connected yet", {
      description: "Wire this action to your backend when you are ready.",
    });
  };

  return (
    <>
      <section
        aria-labelledby={headingId}
        className="w-full rounded-xl border border-destructive/25 bg-destructive/3 p-4 dark:bg-destructive/6"
      >
        <div className="w-full space-y-2">
          <h2
            id={headingId}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-destructive"
          >
            Danger zone
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sign out on this device or permanently remove your account and
            associated data. These actions cannot always be undone.
          </p>
        </div>

        <div className="mt-6 w-full space-y-8 sm:mt-8">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">Log out</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                End your session on this browser. You will need to sign in again
                to access the admin panel.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              hoverScale={1}
              tapScale={1}
              className={`${actionButtonClass} border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50 dark:hover:bg-destructive/15`}
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              {isLoggingOut ? "Signing out…" : "Log out"}
            </Button>
          </div>

          <Separator className="bg-border/80" />

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Delete account
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Permanently delete your user, profile, and memberships.
                Organization data you own may require a separate owner transfer
                first.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              hoverScale={1}
              tapScale={1}
              className={actionButtonClass}
              onClick={() => setDeleteOpen(true)}
            >
              Delete account
            </Button>
          </div>
        </div>
      </section>

      <ConfirmAlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <ConfirmAlertDialog.Content>
          <ConfirmAlertDialog.Icon aria-hidden="true">
            <AlertTriangle />
          </ConfirmAlertDialog.Icon>

          <ConfirmAlertDialog.Header>
            <ConfirmAlertDialog.Title>
              Delete your account?
            </ConfirmAlertDialog.Title>
            <ConfirmAlertDialog.Description>
              This permanently removes your profile and memberships. Demo only —
              no API call runs until you connect a delete endpoint.
            </ConfirmAlertDialog.Description>
          </ConfirmAlertDialog.Header>

          <ConfirmAlertDialog.Confirmation
            match="DELETE"
            placeholder="DELETE"
            label="Confirmation"
            hint="Type DELETE in uppercase to enable the delete button."
          />

          <ConfirmAlertDialog.Actions layout="stack-destructive-first">
            <ConfirmAlertDialog.Cancel>Keep account</ConfirmAlertDialog.Cancel>
            <ConfirmAlertDialog.Action
              requiresMatch
              onClick={handleDeleteConfirm}
            >
              Permanently delete account
            </ConfirmAlertDialog.Action>
          </ConfirmAlertDialog.Actions>
        </ConfirmAlertDialog.Content>
      </ConfirmAlertDialog>
    </>
  );
}
