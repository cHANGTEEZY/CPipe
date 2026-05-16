import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import { Loader2, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const { activeProjectId } = useAppStore();
  const workspaces = useQuery(api.workspaces.list);

  if (workspaces === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <LayoutDashboard className="size-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">
          {activeProjectId ? "Select the Board" : "No project selected"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {activeProjectId
            ? "Click Board in the sidebar to open your Kanban board."
            : "Use the sidebar to select or create a project, then open the Board from the sidebar."}
        </p>
      </div>
    </div>
  );
}
