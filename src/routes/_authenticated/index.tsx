import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import { useEffect } from "react";
import { KanbanBoard } from "@/components/kanban/board";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { Loader2, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { activeProjectId, activeWorkspaceId } = useAppStore();
  const workspaces = useQuery(api.workspaces.list);

  // If user has no workspaces yet, show welcome screen
  if (workspaces === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeProjectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
            <LayoutDashboard className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">No project selected</h2>
          <p className="text-sm text-muted-foreground">
            Use the sidebar to select or create a project, then your Kanban board will appear here.
          </p>
        </div>
      </div>
    );
  }

  return <BoardView projectId={activeProjectId} />;
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
