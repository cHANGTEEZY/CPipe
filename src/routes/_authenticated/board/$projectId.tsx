import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/kanban/board";
import { SearchFilterBar } from "@/components/search-filter-bar";
import type { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/board/$projectId")({
  component: BoardPage,
});

function BoardPage() {
  const { projectId } = Route.useParams();
  return <BoardView projectId={projectId as Id<"projects">} />;
}

function BoardView({ projectId }: { projectId: Id<"projects"> }) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <SearchFilterBar
        onFilter={() => {}}
      />
      <div className="flex-1 min-h-0">
        <KanbanBoard projectId={projectId} />
      </div>
    </div>
  );
}
