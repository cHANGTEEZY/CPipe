import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import {
  Activity as ActivityIcon,
  Loader2,
  Filter,
  GitBranch,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityGitGraph } from "@/components/activity/activity-git-graph";

export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { activeWorkspaceId } = useAppStore();
  const [projectId, setProjectId] = useState<string>("all");

  const logs = useQuery(
    api.activity.listByWorkspace,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId, limit: 200 } : "skip",
  );

  const projects = useQuery(
    api.projects.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip",
  );

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (projectId === "all") return logs;
    return logs.filter((log) => log.projectId === projectId);
  }, [logs, projectId]);

  if (!activeWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <ActivityIcon className="size-12 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">Select a workspace to view activity</p>
      </div>
    );
  }

  if (logs === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Activity Graph</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {projectId === "all"
              ? "One lane per project. Filter a project to see column lanes for task moves."
              : "Lanes follow board columns; blue merges show tasks moving between columns."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-2">
        <ActivityGitGraph
          logs={filteredLogs}
          groupBy={projectId === "all" ? "project" : "column"}
        />
      </ScrollArea>
    </div>
  );
}
