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
import { NumberTicker } from "@/components/ui/number-ticker";

interface ColumnProps {
  column: any;
  projectId: Id<"projects">;
  pointsEnabled: boolean;
  canWrite: boolean;
  canDelete: boolean;
  isGrid?: boolean;
  isDraggingOverlay?: boolean;
}

export function KanbanColumn({ column, projectId, pointsEnabled, canWrite, canDelete, isGrid, isDraggingOverlay }: ColumnProps) {
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
    disabled: !canWrite || isDraggingOverlay,
  });

  const style = {
    transform: isDraggingOverlay ? undefined : CSS.Translate.toString(transform),
    transition: isDragging || isDraggingOverlay ? undefined : transition,
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

  const isCardOver = active?.data.current?.type === "card" && (over?.id === column._id || over?.data?.current?.columnId === column._id);
  const isColumnOver = active?.data.current?.type === "column" && over?.id === column._id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex shrink-0 flex-col rounded-xl border bg-muted/30 backdrop-blur-sm max-h-full transition-all duration-200",
        isGrid && !isDraggingOverlay ? "w-full" : "w-[320px] max-w-full",
        isDragging && "opacity-20 scale-[0.98] border-dashed",
        isCardOver && !isDragging && "border-primary/70 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)]",
        isColumnOver && !isDragging && "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.01] shadow-xl z-10"
      )}
    >
      {/* Column header */}
      <div 
        {...attributes}
        {...listeners}
        className={cn(
          "flex items-center gap-2 p-3 pb-2",
          canWrite ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        )}
      >
        <div className={cn("text-muted-foreground", !canWrite && "opacity-50")}>
          <GripVertical className="size-4" />
        </div>

        {editing ? (
          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
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
              className="h-6 w-full px-1 text-sm font-semibold"
            />
          </div>
        ) : (
          <span
            className="flex-1 text-sm font-semibold leading-none truncate"
            onDoubleClick={() => canWrite && setEditing(true)}
          >
            {column.name}
          </span>
        )}

        <NumberTicker
          value={cards.length}
          className="text-xs font-medium text-muted-foreground"
        />

        {canWrite && (
          <div onClick={(e) => e.stopPropagation()}>
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
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 px-3 flex-1 overflow-y-auto max-h-[calc(100vh-260px)]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card: any) => (
            <KanbanCard key={card._id} card={card} columnId={column._id} canWrite={canWrite} canDelete={canDelete} />
          ))}
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
