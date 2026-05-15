import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CardDetailModal } from "./card-detail-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-500/15 text-red-600",
  feature: "bg-blue-500/15 text-blue-600",
  design: "bg-purple-500/15 text-purple-600",
  backend: "bg-orange-500/15 text-orange-600",
  frontend: "bg-cyan-500/15 text-cyan-600",
  docs: "bg-green-500/15 text-green-600",
};

interface CardProps {
  card: any;
  columnId?: Id<"columns">;
  isDragging?: boolean;
}

export function KanbanCard({ card, columnId, isDragging }: CardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const removeCard = useMutation(api.cards.remove);
  const assignee = useQuery(
    api.users.getMe, // TODO: replace with getUser(card.assigneeId) when available
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card._id,
    data: { type: "card", card, columnId, order: card.order },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await removeCard({ cardId: card._id });
      toast.success("Card deleted");
    } catch {
      toast.error("Failed to delete card");
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative flex flex-col gap-2 rounded-lg border bg-background p-3 shadow-sm cursor-pointer select-none",
          "hover:border-primary/50 hover:shadow-md transition-all duration-150",
          (isDragging || isSortableDragging) && "opacity-50 ring-2 ring-primary shadow-lg"
        )}
        onClick={() => setDetailOpen(true)}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground"
        >
          <GripVertical className="size-3.5" />
        </button>

        {/* Labels */}
        {card.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.map((label: string) => (
              <span
                key={label}
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  LABEL_COLORS[label.toLowerCase()] ?? "bg-muted text-muted-foreground"
                )}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-sm font-medium leading-snug pl-4 group-hover:pl-0 transition-all duration-150">
          {card.title}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {card.points != null && (
              <Badge variant="secondary" className="h-5 text-xs px-1.5">
                {card.points} pts
              </Badge>
            )}
            {card.assigneeId && (
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {assignee?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <CardDetailModal
        card={card}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
