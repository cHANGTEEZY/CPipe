import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import { Loader2, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const { activeWorkspaceId, activeProjectId, setActiveWorkspace, setActiveProject } = useAppStore();
  const workspaces = useQuery(api.workspaces.list);
  const projects = useQuery(
    api.projects.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  );
  
  const createWorkspace = useMutation(api.workspaces.create);
  const createProject = useMutation(api.projects.create);
  const navigate = useNavigate();

  const [wsName, setWsName] = useState("");
  const [loading, setLoading] = useState(false);
  const [projName, setProjName] = useState("");

  // Auto-navigate to project if active
  useEffect(() => {
    if (activeProjectId) {
      navigate({ to: "/board/$projectId", params: { projectId: activeProjectId }, replace: true });
    }
  }, [activeProjectId, navigate]);

  if (workspaces === undefined || (activeWorkspaceId && projects === undefined)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!wsName.trim()) return;
    setLoading(true);
    try {
      const id = await createWorkspace({ name: wsName.trim() });
      setActiveWorkspace(id as Id<"workspaces">);
      toast.success("Workspace created");
    } catch {
      toast.error("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projName.trim() || !activeWorkspaceId) return;
    setLoading(true);
    try {
      const id = await createProject({ workspaceId: activeWorkspaceId, name: projName.trim(), pointsEnabled: false });
      setActiveProject(id as Id<"projects">);
      toast.success("Project created");
    } catch {
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
            <LayoutDashboard className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Welcome to CPipeLine</h2>
            <p className="text-sm text-muted-foreground">Create your first workspace to get started.</p>
          </div>
          <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-4 text-left">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input required placeholder="e.g. Acme Corp" value={wsName} onChange={(e) => setWsName(e.target.value)} />
            </div>
            <Button className="w-full" type="submit" disabled={loading || !wsName.trim()}>
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (activeWorkspaceId && projects && projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
            <LayoutDashboard className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Workspace is empty</h2>
            <p className="text-sm text-muted-foreground">Create your first project to start tracking tasks.</p>
          </div>
          <form onSubmit={handleCreateProject} className="space-y-4 pt-4 text-left">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input required placeholder="e.g. Website Redesign" value={projName} onChange={(e) => setProjName(e.target.value)} />
            </div>
            <Button className="w-full" type="submit" disabled={loading || !projName.trim()}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <LayoutDashboard className="size-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Select the Board</h2>
        <p className="text-sm text-muted-foreground">
          Use the sidebar to select a workspace and project.
        </p>
      </div>
    </div>
  );
}
