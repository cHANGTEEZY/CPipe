import type { Id } from "@convex/_generated/dataModel";
import { KanbanBoard } from "@/components/kanban/board";
import { SearchFilterBar } from "@/components/search-filter-bar";

type BoardPageProps = {
  projectId: Id<"projects">;
};

function BoardPage({ projectId }: BoardPageProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <SearchFilterBar onFilter={() => {}} />
      <div className="flex-1 min-h-0">
        <KanbanBoard projectId={projectId} />
      </div>
    </div>
  );
}

export default BoardPage;
