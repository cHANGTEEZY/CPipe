import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, rectSortingStrategy } from "@dnd-kit/sortable";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { KanbanColumn } from "./column";
import { KanbanCard } from "./card";
import { AddColumnForm } from "./add-column-form";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BoardProps {
  projectId: Id<"projects">;
}

export function KanbanBoard({ projectId }: BoardProps) {
  const columns = useQuery(api.columns.list, { projectId }) ?? [];
  const project = useQuery(api.projects.get, { projectId });
  const moveCard = useMutation(api.cards.move);
  const reorderCards = useMutation(api.cards.reorder);
  const reorderColumns = useMutation(api.columns.reorder);

  const [activeCard, setActiveCard] = useState<any>(null);
  const [activeCardData, setActiveCardData] = useState<any>(null);
  const [layout, setLayout] = useState<"scroll" | "2" | "3" | "4">("scroll");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const myMembership = useQuery(
    api.members.getMyMembership,
    project ? { workspaceId: project.workspaceId } : "skip"
  );
  
  const canWrite = myMembership && ["owner", "admin", "editor"].includes(myMembership.role);
  const canDelete = myMembership && ["owner", "admin"].includes(myMembership.role);

  if (project === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Project not found
      </div>
    );
  }

  function onDragStart(event: DragStartEvent) {
    if (!canWrite) return;
    if (event.active.data.current?.type === "card") {
      setActiveCard(event.active.id);
      setActiveCardData(event.active.data.current.card);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    setActiveCardData(null);
    if (!canWrite) return;
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Column reorder
    if (activeType === "column" && overType === "column") {
      const oldIndex = columns.findIndex((c: any) => c._id === active.id);
      const newIndex = columns.findIndex((c: any) => c._id === over.id);
      if (oldIndex !== newIndex) {
        const reordered = [...columns];
        const [removed] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, removed);
        await reorderColumns({
          projectId,
          orderedIds: reordered.map((c: any) => c._id),
        });
      }
      return;
    }

    // Card move between columns or reorder within column
    if (activeType === "card") {
      const toColumnId =
        overType === "column"
          ? (over.id as Id<"columns">)
          : (over.data.current?.columnId as Id<"columns">);
      if (!toColumnId) return;

      await moveCard({
        cardId: active.id as Id<"cards">,
        toColumnId,
        newOrder: over.data.current?.order ?? 0,
      });
    }
  }

  async function onDragOver(event: DragOverEvent) {
    // Handled in onDragEnd for simplicity — Convex live queries update other clients in real-time
  }

  const columnIds = columns.map((c: any) => c._id);

  return (
    <div className="flex h-full flex-col">
      {/* Board header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          {project.pointsEnabled && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Points enabled
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={layout} onValueChange={(val: any) => setLayout(val)}>
            <SelectTrigger className="w-[180px] h-9 text-sm bg-background">
              <SelectValue placeholder="Layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scroll">Horizontal (Scroll)</SelectItem>
              <SelectItem value="2">Grid (2 Columns)</SelectItem>
              <SelectItem value="3">Grid (3 Columns)</SelectItem>
              <SelectItem value="4">Grid (4 Columns)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div 
          className={cn(
            layout === "scroll" 
              ? "flex gap-4 overflow-x-auto pb-4 flex-1 items-start"
              : `grid gap-4 overflow-y-auto pb-4 flex-1 items-start ${
                  layout === "2" ? "grid-cols-1 md:grid-cols-2" :
                  layout === "3" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" :
                  "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                }`
          )}
        >
          <SortableContext items={columnIds} strategy={layout === "scroll" ? horizontalListSortingStrategy : rectSortingStrategy}>
            {columns.map((col: any) => (
              <KanbanColumn
                key={col._id}
                column={col}
                projectId={projectId}
                pointsEnabled={project.pointsEnabled}
                canWrite={!!canWrite}
                canDelete={!!canDelete}
                isGrid={layout !== "scroll"}
              />
            ))}
          </SortableContext>
          {canWrite && <AddColumnForm projectId={projectId} />}
        </div>

        <DragOverlay>
          {activeCardData && (
            <div className="rotate-2 opacity-90">
              <KanbanCard card={activeCardData} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
