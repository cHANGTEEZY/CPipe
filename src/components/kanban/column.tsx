import { useState } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { KanbanCard } from "./card";
import { AddCardForm } from "./add-card-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ColumnProps {
  column: any;
  projectId: Id<"projects">;
  pointsEnabled: boolean;
  canWrite: boolean;
  canDelete: boolean;
  isGrid?: boolean;
}

export function KanbanColumn({ column, projectId, pointsEnabled, canWrite, canDelete, isGrid }: ColumnProps) {
  const cards = useQuery(api.cards.listByColumn, { columnId: column._id }) ?? [];
  const renameColumn = useMutation(api.columns.rename);
  const deleteColumn = useMutation(api.columns.remove);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [showAddCard, setShowAddCard] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over,
    active,
  } = useSortable({
    id: column._id,
    data: { type: "column" },
    disabled: !canWrite,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const totalPoints = pointsEnabled
    ? cards.reduce((sum: number, c: any) => sum + (c.points ?? 0), 0)
    : 0;

  const cardIds = cards.map((c: any) => c._id);

  async function handleRename() {
    if (name.trim() === column.name || !name.trim()) {
      setEditing(false);
      setName(column.name);
      return;
    }
    try {
      await renameColumn({ columnId: column._id, name: name.trim() });
      toast.success("Column renamed");
    } catch {
      toast.error("Failed to rename");
    }
    setEditing(false);
  }

  async function handleDelete() {
    try {
      await deleteColumn({ columnId: column._id });
      toast.success("Column deleted");
    } catch {
      toast.error("Failed to delete column");
    }
  }

  const isDropTarget = !isDragging && (over?.id === column._id || over?.data?.current?.columnId === column._id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex shrink-0 flex-col rounded-xl border bg-muted/30 backdrop-blur-sm max-h-full transition-colors duration-200",
        isGrid ? "w-full" : "w-[320px]",
        isDragging && "opacity-40 ring-2 ring-primary",
        isDropTarget && "border-primary/70 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 p-3 pb-2">
        <button
          {...attributes}
          {...listeners}
          disabled={!canWrite}
          className={cn("text-muted-foreground", canWrite ? "cursor-grab active:cursor-grabbing hover:text-foreground" : "cursor-default opacity-50")}
        >
          <GripVertical className="size-4" />
        </button>

        {editing ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setEditing(false);
                setName(column.name);
              }
            }}
            className="h-6 flex-1 px-1 text-sm font-semibold"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold leading-none cursor-default"
            onDoubleClick={() => canWrite && setEditing(true)}
          >
            {column.name}
          </span>
        )}

        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {cards.length}
        </span>

        {canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6 shrink-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)} className="gap-2">
                <Pencil className="size-4" /> Rename
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" /> Delete column
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 px-3 flex-1 overflow-y-auto max-h-[calc(100vh-260px)]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card: any) => (
            <KanbanCard key={card._id} card={card} columnId={column._id} canWrite={canWrite} canDelete={canDelete} />
          ))}
          {/* Inject placeholder if this column is the active drop target for a card from another column */}
          {isDropTarget && active?.data?.current?.type === "card" && active?.data?.current?.columnId !== column._id && (
            <div className="rounded-lg border-2 border-dashed border-primary bg-primary/10 opacity-50 h-[100px] w-full transition-all duration-150" />
          )}
        </SortableContext>
      </div>

      {/* Add card */}
      {canWrite && (
        <div className="p-3 pt-2">
          {showAddCard ? (
            <AddCardForm
              columnId={column._id}
              projectId={projectId}
              onClose={() => setShowAddCard(false)}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddCard(true)}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" />
              Add card
            </Button>
          )}
        </div>
      )}

      {/* Points footer */}
      {pointsEnabled && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex justify-between">
          <span>Total points</span>
          <span className="font-semibold text-foreground">{totalPoints}</span>
        </div>
      )}
    </div>
  );
}
