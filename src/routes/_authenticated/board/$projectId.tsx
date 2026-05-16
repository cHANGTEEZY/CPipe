import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/kanban/board";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/board/$projectId")({
  component: BoardPage,
});

function BoardPage() {
  const { projectId } = Route.useParams();
  return <BoardView projectId={projectId as Id<"projects">} />;
}

function BoardView({ projectId }: { projectId: Id<"projects"> }) {
  const [filterQuery, setFilterQuery] = useState("");
  const [filterLabels, setFilterLabels] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <SearchFilterBar
        projectId={projectId}
        onFilter={(q, labels) => {
          setFilterQuery(q);
          setFilterLabels(labels);
        }}
      />
      <div className="flex-1 min-h-0">
        <KanbanBoard projectId={projectId} />
      </div>
    </div>
  );
}
