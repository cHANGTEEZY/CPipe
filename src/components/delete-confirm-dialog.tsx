import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDeleteConfirm,
  type DeleteConfirmSeverity,
} from "@/hooks/use-delete-confirm";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

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
  cancelLabel = "Cancel",
  severity = "normal",
  loading = false,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const isCritical = severity === "critical";
  const confirmInputId = useId();
  const [confirmInput, setConfirmInput] = useState("");
  const confirmReady = !isCritical || confirmInput.trim() === "DELETE";

  useEffect(() => {
    if (!open) setConfirmInput("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        from="top"
        className={cn(
          "max-w-[min(calc(100vw-2rem),22rem)] gap-0 overflow-hidden rounded-[2rem]",
          "border-0 bg-neutral-100 p-8 shadow-lg dark:bg-neutral-900 sm:max-w-sm",
        )}
      >
        <AlertDialogHeader className="items-center gap-0 text-center sm:items-center sm:text-center">
          <AlertDialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <Trash2
          className="mx-auto mt-6 size-11 text-red-500"
          strokeWidth={1.75}
          aria-hidden
        />

        <AlertDialogDescription asChild>
          <p className="mt-5 text-center text-sm leading-relaxed text-muted-foreground">
            {itemName ? (
              <>
                <span className="font-medium text-foreground">{itemName}</span>
                {" — "}
              </>
            ) : null}
            {description}
          </p>
        </AlertDialogDescription>

        {isCritical ? (
          <div className="mt-6 space-y-2 text-left">
            <Label
              htmlFor={confirmInputId}
              className="text-xs font-medium text-foreground"
            >
              Type <span className="font-mono">DELETE</span> to confirm
            </Label>
            <Input
              id={confirmInputId}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="h-10 border-neutral-200 bg-white font-mono text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>
        ) : null}

        <AlertDialogFooter className="mt-8 flex-row gap-3 sm:justify-center">
          <AlertDialogAction
            disabled={loading || !confirmReady}
            className={cn(
              "h-11 flex-1 cursor-pointer rounded-full border-0 shadow-none",
              "bg-red-500 text-white hover:bg-red-600 hover:text-white",
              "dark:bg-red-500 dark:hover:bg-red-600",
              "disabled:opacity-50",
            )}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {loading ? "Deleting…" : confirmLabel}
          </AlertDialogAction>

          <AlertDialogCancel
            disabled={loading}
            className={cn(
              "h-11 flex-1 cursor-pointer rounded-full border-0 shadow-none",
              "bg-neutral-200 text-muted-foreground hover:bg-neutral-300 hover:text-foreground",
              "dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200",
            )}
          >
            {cancelLabel}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
      cancelLabel={active.cancelLabel ?? "Cancel"}
      severity={active.severity}
      loading={loading}
      onConfirm={() => void runConfirm()}
    />
  );
}
