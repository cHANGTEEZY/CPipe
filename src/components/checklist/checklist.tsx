import { useMemo } from "react";
import { ListTodo, Trash2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  PinList,
  type PinListItem,
} from "@/components/animate-ui/components/community/pin-list";
import { ClipboardActionButton } from "@/components/clipboard/clipboard-action-button";
import { Button } from "@/components/ui/button";

export type ChecklistItem = {
  id: string;
  title: string;
  completed: boolean;
  pinned: boolean;
};

type ChecklistProps = {
  items: ChecklistItem[];
  canEdit: boolean;
  emptyMessage?: string;
  onToggleComplete: (id: string, completed: boolean) => void;
  onTogglePin: (id: string) => void;
  onRemove: (id: string) => void;
  onAddToClipboard?: (id: string) => void;
};

function Checklist({
  items,
  canEdit,
  emptyMessage = "No items yet.",
  onToggleComplete,
  onTogglePin,
  onRemove,
  onAddToClipboard,
}: ChecklistProps) {
  const linked = useQuery(api.clipboard.listLinkedSourceIds);
  const onClipboardSet = useMemo(
    () => new Set(linked?.todoIds ?? []),
    [linked?.todoIds],
  );

  const pinItems: PinListItem[] = items.map((item) => ({
    id: item.id,
    name: item.title,
    info: "",
    icon: ListTodo,
    pinned: item.pinned,
    completed: item.completed,
  }));

  return (
    <PinList
      items={pinItems}
      layoutIdPrefix="project-checklist"
      playfulCheckoff
      onTogglePin={canEdit ? onTogglePin : undefined}
      onToggleComplete={canEdit ? onToggleComplete : undefined}
      readOnly={!canEdit}
      labels={{ pinned: "Pinned", unpinned: "Tasks" }}
      emptyMessage={emptyMessage}
      renderTrailing={(item) => (
        <>
          {onAddToClipboard && (
            <ClipboardActionButton
              onClipboard={onClipboardSet.has(item.id as Id<"projectTodos">)}
              onClick={() => {
                if (!onClipboardSet.has(item.id as Id<"projectTodos">)) {
                  onAddToClipboard(item.id);
                }
              }}
            />
          )}
          {canEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </>
      )}
    />
  );
}

export { Checklist };
