import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import { 
  Activity as ActivityIcon, 
  ArrowRight, 
  CheckCircle2, 
  Trash2, 
  PlusCircle, 
  UserPlus, 
  User as UserIcon,
  Building2,
  Clock,
  Loader2,
  Folder,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { activeWorkspaceId } = useAppStore();
  const [projectId, setProjectId] = useState<string>("all");
  
  const logs = useQuery(
    api.activity.listByWorkspace, 
    activeWorkspaceId ? { workspaceId: activeWorkspaceId, limit: 100 } : "skip"
  );
  
  const projects = useQuery(
    api.projects.list, 
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  );

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (projectId === "all") return logs;
    return logs.filter(log => log.projectId === projectId);
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
          <h1 className="text-2xl font-bold tracking-tight">Workspace Activity</h1>
          <p className="text-muted-foreground text-sm">
            A real-time log of everything happening in this workspace.
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
              {projects?.map(p => (
                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-2">
              <Clock className="size-8 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground">No activity found</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <ActivityItem key={log._id} log={log} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ActivityItem({ log }: { log: any }) {
  const getIcon = () => {
    switch (log.entityType) {
      case "card":
        if (log.action === "created") return <PlusCircle className="size-4 text-green-500" />;
        if (log.action === "deleted") return <Trash2 className="size-4 text-red-500" />;
        if (log.action === "moved") return <ArrowRight className="size-4 text-blue-500" />;
        return <CheckCircle2 className="size-4 text-primary" />;
      case "member":
        if (log.action === "joined") return <UserPlus className="size-4 text-green-500" />;
        return <UserIcon className="size-4 text-orange-500" />;
      case "workspace":
        return <Building2 className="size-4 text-purple-500" />;
      case "project":
        return <Folder className="size-4 text-yellow-500" />;
      default:
        return <ActivityIcon className="size-4 text-muted-foreground" />;
    }
  };

  const getActionText = () => {
    const userName = log.user?.profile?.displayName ?? log.user?.name ?? "Someone";
    const target = <span className="font-semibold text-foreground">{log.targetName}</span>;
    const type = log.entityType === "card" ? "task" : log.entityType;

    switch (log.action) {
      case "created":
        return <>{userName} created {type} {target}</>;
      case "deleted":
        return <>{userName} deleted {type} {target}</>;
      case "moved":
        return (
          <>
            {userName} moved {target} from{" "}
            <Badge variant="outline" className="font-normal mx-1 uppercase text-[10px]">{log.meta?.fromColumnName}</Badge>
            to
            <Badge variant="secondary" className="font-normal mx-1 uppercase text-[10px]">{log.meta?.toColumnName}</Badge>
          </>
        );
      case "updated":
        return <>{userName} updated {type} {target}</>;
      case "joined":
        return <>{userName} joined the workspace as <Badge variant="outline" className="ml-1 uppercase text-[10px]">{log.meta?.role}</Badge></>;
      case "role_updated":
        return <>{userName} updated the role of {target} to <Badge variant="secondary" className="ml-1 uppercase text-[10px]">{log.meta?.role}</Badge></>;
      case "removed":
        return <>{userName} removed {target} from the workspace</>;
      default:
        return <>{userName} {log.action} {type} {target}</>;
    }
  };

  return (
    <div className="relative pl-12 transition-all duration-200 group">
      <div className="absolute left-0 top-1 flex size-10 items-center justify-center rounded-full bg-card border shadow-sm group-hover:scale-110 transition-transform duration-200 z-10">
        {getIcon()}
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getActionText()}
          </p>
          {log.projectName && (
            <Badge variant="outline" className="h-4 px-1 text-[9px] font-bold text-muted-foreground/50 border-muted-foreground/20 uppercase tracking-tighter">
              {log.projectName}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
          <Clock className="size-3" />
          {formatDistanceToNow(log.createdAt, { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

