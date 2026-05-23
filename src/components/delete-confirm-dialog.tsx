import { ConfirmAlertDialog } from "@/components/confirm-alert-dialog";
import {
  useDeleteConfirm,
  type DeleteConfirmSeverity,
} from "@/hooks/use-delete-confirm";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

export type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: DeleteConfirmSeverity;
  loading?: boolean;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  confirmLabel = "Delete",
  cancelLabel = "Keep it",
  severity = "normal",
  loading = false,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const isCritical = severity === "critical";

  return (
    <ConfirmAlertDialog open={open} onOpenChange={onOpenChange}>
      <ConfirmAlertDialog.Content className="border-destructive/20 bg-gradient-to-b from-background to-destructive/[0.04] dark:to-destructive/[0.08]">
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-0.5 text-xs font-bold tracking-tight text-primary-foreground shadow-sm">
            CP
          </span>
        </div>

        <ConfirmAlertDialog.Icon className="mb-1">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/12 ring-1 ring-destructive/25 sm:size-16">
            <Trash2 className="size-7 text-destructive sm:size-8" />
          </span>
        </ConfirmAlertDialog.Icon>

        <ConfirmAlertDialog.Header>
          <ConfirmAlertDialog.Title>{title}</ConfirmAlertDialog.Title>
          <ConfirmAlertDialog.Description className="max-w-sm">
            {description}
          </ConfirmAlertDialog.Description>
        </ConfirmAlertDialog.Header>

        {itemName ? (
          <div
            className="mt-5 w-full rounded-xl border border-border/80 bg-muted/50 px-4 py-3 text-center shadow-inner"
            aria-label="Item to delete"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              You are removing
            </p>
            <p className="mt-1 truncate text-base font-semibold text-foreground">
              {itemName}
            </p>
          </div>
        ) : null}

        {isCritical ? (
          <ConfirmAlertDialog.Confirmation
            match="DELETE"
            placeholder="DELETE"
            label="Confirmation"
            hint="Type DELETE in uppercase to enable permanent deletion."
          />
        ) : null}

        <ConfirmAlertDialog.Actions
          layout={isCritical ? "stack-destructive-first" : "row"}
        >
          <ConfirmAlertDialog.Cancel disabled={loading}>
            {cancelLabel}
          </ConfirmAlertDialog.Cancel>
          <ConfirmAlertDialog.Action
            requiresMatch={isCritical}
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {loading ? "Deleting…" : confirmLabel}
          </ConfirmAlertDialog.Action>
        </ConfirmAlertDialog.Actions>
      </ConfirmAlertDialog.Content>
    </ConfirmAlertDialog>
  );
}

/** Renders the dialog for a `useDeleteConfirm()` instance — mount once per screen. */
export function DeleteConfirmHost({
  active,
  loading,
  open,
  dismiss,
  confirm: runConfirm,
}: ReturnType<typeof useDeleteConfirm>) {
  if (!active) return null;

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={(next) => !next && dismiss()}
      title={active.title}
      description={active.description}
      itemName={active.itemName}
      confirmLabel={active.confirmLabel}
      cancelLabel={active.cancelLabel}
      severity={active.severity}
      loading={loading}
      onConfirm={() => void runConfirm()}
    />
  );
}
