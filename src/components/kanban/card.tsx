import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CardDetailModal } from "./card-detail-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare, Flag, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTagLabel } from "@/lib/tag-utils";
import { toast } from "sonner";

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-500/15 text-red-600",
  feature: "bg-blue-500/15 text-blue-600",
  design: "bg-purple-500/15 text-purple-600",
  backend: "bg-orange-500/15 text-orange-600",
  frontend: "bg-cyan-500/15 text-cyan-600",
  docs: "bg-green-500/15 text-green-600",
};

const STATUS_COLORS: Record<string, string> = {
  on_track: "text-green-500",
  at_risk: "text-yellow-500",
  off_track: "text-red-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-blue-400",
  medium: "text-yellow-500",
  high: "text-orange-500",
  urgent: "text-red-600",
};

const PRIORITY_BG_COLORS: Record<string, string> = {
  low: "bg-blue-500/[0.03] border-blue-500/10 hover:bg-blue-500/[0.06] hover:border-blue-500/20",
  medium: "bg-yellow-500/[0.03] border-yellow-500/10 hover:bg-yellow-500/[0.06] hover:border-yellow-500/20",
  high: "bg-orange-500/[0.03] border-orange-500/10 hover:bg-orange-500/[0.06] hover:border-orange-500/20",
  urgent: "bg-red-500/[0.03] border-red-500/10 hover:bg-red-500/[0.06] hover:border-red-500/20",
};

interface CardProps {
  card: any;
  columnId?: Id<"columns">;
  isDragging?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  dragBlockReason?: string | null;
}

export function KanbanCard({
  card,
  columnId,
  isDragging,
  canWrite = true,
  canDelete = true,
  dragBlockReason = null,
}: CardProps) {
  const isDragBlocked = !!dragBlockReason;
  const [detailOpen, setDetailOpen] = useState(false);
  const removeCard = useMutation(api.cards.remove);
  
  const comments = useQuery(api.comments.list, { cardId: card._id });
  const project = useQuery(api.projects.get, { projectId: card.projectId });
  const members = useQuery(api.members.list, project?.workspaceId ? { workspaceId: project.workspaceId } : "skip");
  const fallbackAssignee = useQuery(api.users.getById, card.assigneeId ? { userId: card.assigneeId } : "skip");
  
  const assigneeMember = members?.find((m: any) => m.userId === card.assigneeId);
  const assignee = assigneeMember?.user || fallbackAssignee;

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
    disabled: !canWrite || isDragging || isDragBlocked,
  });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    transition: isDragging || isSortableDragging ? undefined : transition,
    zIndex: isSortableDragging ? 100 : undefined,
    touchAction: "none",
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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "group relative flex flex-col gap-2 rounded-lg border p-3 shadow-sm select-none w-full transition-all duration-150",
          card.priority
            ? (PRIORITY_BG_COLORS[card.priority] ??
              "bg-card hover:bg-accent/50 hover:border-primary/40")
            : "bg-card hover:bg-accent/50 hover:border-primary/40",
          canWrite && !isDragBlocked
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-pointer",
          isDragBlocked && "border-amber-500/40 bg-amber-500/[0.04]",
          isSortableDragging && "opacity-40 scale-[0.98] shadow-none",
          isDragging && "opacity-90 ring-2 ring-primary shadow-lg cursor-grabbing",
          isHoveredDropzone && "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-md"
        )}
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Labels */}
          <div className="flex flex-wrap gap-1">
            {card.labels?.map((label: string) => (
              <span
                key={label}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  LABEL_COLORS[label.toLowerCase()] ??
                    "bg-secondary text-secondary-foreground",
                )}
              >
                {formatTagLabel(label)}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
             {card.status && (
               <div
                 className={cn(
                   "size-2 rounded-full bg-current",
                   STATUS_COLORS[card.status] ?? "text-muted-foreground",
                 )}
                 title={formatTagLabel(card.status)}
               />
             )}
             {card.priority && (
               <Flag
                 className={cn(
                   "size-3",
                   PRIORITY_COLORS[card.priority] ?? "text-muted-foreground",
                 )}
                 fill="currentColor"
                 aria-label={formatTagLabel(card.priority)}
               />
             )}
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-medium leading-snug transition-all duration-150 line-clamp-2">
          {card.title}
        </p>

        {dragBlockReason && (
          <div className="flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-[10px] leading-snug text-amber-800 dark:text-amber-200">
            <Lock className="size-3 shrink-0 mt-0.5" />
            <span>{dragBlockReason}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {card.assigneeId && (
              <div 
                className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ring-1 ring-primary/20 shadow-sm overflow-hidden" 
                title={assignee?.profile?.displayName || assignee?.name || "Unassigned"}
              >
                {assignee?.profile?.avatarUrl ? (
                  <img src={assignee.profile.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  (assignee?.profile?.displayName?.[0] ?? assignee?.name?.[0] ?? "?").toUpperCase()
                )}
              </div>
            )}

            {card.points != null && (
              <Badge variant="secondary" className="h-5 text-[10px] px-1.5 font-bold tabular-nums">
                {card.points}
              </Badge>
            )}
            
            {comments && comments.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                <MessageSquare className="size-3" />
                {comments.length}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
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
