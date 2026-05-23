import * as React from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DataTableRowActionsProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  confirmTitle?: string;
  confirmDescription?: React.ReactNode;
  confirmActionLabel?: string;
  cancelLabel?: string;
  /** Shown in the branded highlight box when set */
  itemName?: string;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
};

export function DataTableRowActions({
  onEdit,
  onDelete,
  disabled,
  editLabel = "Edit",
  deleteLabel = "Delete",
  confirmTitle = "Delete this row?",
  confirmDescription = "This cannot be undone.",
  confirmActionLabel = "Delete",
  cancelLabel = "Cancel",
  itemName,
  align = "end",
  triggerClassName,
}: DataTableRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleDeleteConfirm = React.useCallback(() => {
    onDelete?.();
    setConfirmOpen(false);
  }, [onDelete]);

  const openDeleteConfirm = React.useCallback(() => {
    setTimeout(() => setConfirmOpen(true), 0);
  }, []);

  const showEdit = Boolean(onEdit);
  const showDelete = Boolean(onDelete);

  const iconButtonClass =
    "h-8 w-8 shrink-0 cursor-pointer disabled:cursor-not-allowed";

  if (!showEdit && !showDelete) {
    return null;
  }

  return (
    <>
      {/* md+: visible icon actions */}
      <div className="hidden items-center justify-end gap-0.5 md:flex">
        {showEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(iconButtonClass)}
            disabled={disabled}
            aria-label={editLabel}
            title={editLabel}
            onClick={() => onEdit?.()}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null}
        {showDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              iconButtonClass,
              "text-destructive hover:bg-destructive/10 hover:text-destructive",
            )}
            disabled={disabled}
            aria-label={deleteLabel}
            title={deleteLabel}
            onClick={openDeleteConfirm}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {/* Small screens: overflow menu only */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 cursor-pointer disabled:cursor-not-allowed",
                triggerClassName,
              )}
              disabled={disabled}
              aria-label="Row actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={align}
            sideOffset={8}
            collisionPadding={16}
            className="z-70 w-44"
          >
            {showEdit ? (
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={() => {
                  onEdit?.();
                }}
              >
                <Pencil className="h-4 w-4" />
                {editLabel}
              </DropdownMenuItem>
            ) : null}
            {showEdit && showDelete ? <DropdownMenuSeparator /> : null}
            {showDelete ? (
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                onSelect={() => {
                  openDeleteConfirm();
                }}
              >
                <Trash2 className="h-4 w-4" />
                {deleteLabel}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showDelete ? (
        <DeleteConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={confirmTitle}
          description={confirmDescription}
          itemName={itemName}
          confirmLabel={confirmActionLabel}
          cancelLabel={cancelLabel}
          onConfirm={handleDeleteConfirm}
        />
      ) : null}
    </>
  );
}
