import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
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
  canWrite?: boolean;
  canDelete?: boolean;
}

export function KanbanCard({ card, columnId, isDragging, canWrite = true, canDelete = true }: CardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const removeCard = useMutation(api.cards.remove);
  
  // Use members query to get assignee info
  const project = useQuery(api.projects.get, { projectId: card.projectId });
  const members = useQuery(api.members.list, project?.workspaceId ? { workspaceId: project.workspaceId } : "skip");
  const assigneeMember = members?.find((m: any) => m.userId === card.assigneeId);
  const assignee = assigneeMember?.user;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
    over,
  } = useSortable({
    id: card._id,
    data: { type: "card", card, columnId, order: card.order },
    disabled: !canWrite,
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

  const isHoveredDropzone = over?.id === card._id && !isSortableDragging;

  if (isSortableDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border-2 border-dashed border-primary bg-primary/10 opacity-50 h-[100px] w-full transition-all duration-150"
      />
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...(canWrite ? attributes : {})}
        {...(canWrite ? listeners : {})}
        className={cn(
          "group relative flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm select-none",
          canWrite ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          "hover:border-primary/40 hover:shadow-md hover:bg-accent/50 transition-all duration-150",
          isDragging && "opacity-50 ring-2 ring-primary shadow-lg cursor-grabbing",
          isHoveredDropzone && "border-primary bg-primary/10 ring-2 ring-primary ring-opacity-50"
        )}
        onClick={() => setDetailOpen(true)}
      >


        {/* Labels */}
        {card.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.map((label: string) => (
              <span
                key={label}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide",
                  LABEL_COLORS[label.toLowerCase()] ?? "bg-secondary text-secondary-foreground"
                )}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-sm font-medium leading-snug transition-all duration-150">
          {card.title}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-2">
            {card.points != null && (
              <Badge variant="secondary" className="h-5 text-[10px] px-1.5 font-medium">
                {card.points} pts
              </Badge>
            )}
            {card.assigneeId && (
              <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary ring-1 ring-primary/20">
                {assignee?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <CardDetailModal
        card={card}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        canWrite={canWrite}
      />
    </>
  );
}
