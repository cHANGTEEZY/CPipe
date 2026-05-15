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
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { KanbanColumn } from "./column";
import { KanbanCard } from "./card";
import { AddColumnForm } from "./add-column-form";
import { Loader2 } from "lucide-react";

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

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
    if (event.active.data.current?.type === "card") {
      setActiveCard(event.active.id);
      setActiveCardData(event.active.data.current.card);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    setActiveCardData(null);
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
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold">{project.name}</h1>
        {project.pointsEnabled && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Points enabled
          </span>
        )}
      </div>

      {/* Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((col: any) => (
              <KanbanColumn
                key={col._id}
                column={col}
                projectId={projectId}
                pointsEnabled={project.pointsEnabled}
              />
            ))}
          </SortableContext>
          <AddColumnForm projectId={projectId} />
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
