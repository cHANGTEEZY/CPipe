import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import { Loader2, Building2, Kanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { OrbitPicker } from "@/components/home/orbit-picker";
import { Highlighter } from "@/components/ui/highlighter";
import { useAppStoreHydrated } from "@/hooks/use-app-store-hydrated";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const hydrated = useAppStoreHydrated();
  const {
    activeWorkspaceId,
    activeProjectId,
    setActiveWorkspace,
    setActiveProject,
  } = useAppStore();
  const workspaces = useQuery(api.workspaces.list);
  const projects = useQuery(
    api.projects.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip",
  );

  const createWorkspace = useMutation(api.workspaces.create);
  const createProject = useMutation(api.projects.create);
  const navigate = useNavigate();

  const [wsName, setWsName] = useState("");
  const [projName, setProjName] = useState("");
  const [loading, setLoading] = useState(false);

  // Home is a picker — clear project only after hydration (never during pre-hydrate null state)
  useEffect(() => {
    if (!hydrated) return;
    setActiveProject(null);
  }, [hydrated, setActiveProject]);

  if (
    workspaces === undefined ||
    (activeWorkspaceId && projects === undefined)
  ) {
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
      setWsName("");
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
      const id = await createProject({
        workspaceId: activeWorkspaceId,
        name: projName.trim(),
        pointsEnabled: false,
      });
      setActiveProject(id as Id<"projects">);
      toast.success("Project created");
      setProjName("");
    } catch {
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);

  // No workspaces — highlighted empty state
  if (workspaces.length === 0) {
    return (
      <EmptyStateShell
        icon={<Building2 className="size-10 text-primary" />}
        title={
          <>
            Welcome to{" "}
            <Highlighter color="hsl(var(--primary) / 0.35)">CPipeLine</Highlighter>
          </>
        }
        description="Create your first workspace to start organizing projects and boards."
      >
        <form onSubmit={handleCreateWorkspace} className="w-full max-w-sm space-y-4 text-left">
          <div className="space-y-2">
            <Label>Workspace name</Label>
            <Input
              required
              placeholder="e.g. Acme Corp"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
            />
          </div>
          <Button className="w-full gap-2" type="submit" disabled={loading || !wsName.trim()}>
            <Plus className="size-4" />
            {loading ? "Creating…" : "Create workspace"}
          </Button>
        </form>
      </EmptyStateShell>
    );
  }

  // Pick a workspace
  if (!activeWorkspaceId) {
    return (
      <OrbitPicker
        items={workspaces.map((w) => ({ id: w._id, name: w.name }))}
        onSelect={(id) => setActiveWorkspace(id as Id<"workspaces">)}
        title={
          <>
            Choose a{" "}
            <Highlighter color="hsl(var(--primary) / 0.35)">workspace</Highlighter>
          </>
        }
        subtitle="Orbit through your teams — click a circle or label below."
      />
    );
  }

  // Workspace selected but no projects
  if (projects && projects.length === 0) {
    return (
      <EmptyStateShell
        icon={<Kanban className="size-10 text-primary" />}
        title={
          <>
            <Highlighter color="hsl(var(--primary) / 0.35)">
              {activeWorkspace?.name ?? "Workspace"}
            </Highlighter>{" "}
            is empty
          </>
        }
        description="Add your first project to open a kanban board."
        footer={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setActiveWorkspace(null)}
          >
            ← Pick another workspace
          </Button>
        }
      >
        <form onSubmit={handleCreateProject} className="w-full max-w-sm space-y-4 text-left">
          <div className="space-y-2">
            <Label>Project name</Label>
            <Input
              required
              placeholder="e.g. Website Redesign"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
            />
          </div>
          <Button className="w-full gap-2" type="submit" disabled={loading || !projName.trim()}>
            <Plus className="size-4" />
            {loading ? "Creating…" : "Create project"}
          </Button>
        </form>
      </EmptyStateShell>
    );
  }

  // Pick a project
  if (projects && projects.length > 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setActiveWorkspace(null)}
          >
            ← Change workspace
          </Button>
        </div>
        <OrbitPicker
          items={projects.map((p) => ({ id: p._id, name: p.name }))}
          onSelect={(id) => setActiveProject(id as Id<"projects">)}
          title={
            <>
              Open a{" "}
              <Highlighter color="hsl(var(--primary) / 0.35)">project</Highlighter>
            </>
          }
          subtitle={`Projects in ${activeWorkspace?.name ?? "your workspace"}`}
          className="flex-1"
        />
      </div>
    );
  }

  return null;
}

function EmptyStateShell({
  icon,
  title,
  description,
  children,
  footer,
}: {
  icon: ReactNode;
  title: ReactNode;
  description: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 mx-auto ring-1 ring-primary/20">
          {icon}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
