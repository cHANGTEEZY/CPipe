import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { EmptyTestimonial } from "@/components/home/empty-testimonial";
import { OrbitPicker } from "@/components/home/orbit-picker";
import { StarsShell } from "@/components/home/stars-shell";
import { Highlighter } from "@/components/ui/highlighter";
import { useAppStoreHydrated } from "@/hooks/use-app-store-hydrated";

function HomePage() {
  const hydrated = useAppStoreHydrated();
  const { activeWorkspaceId, setActiveWorkspace, setActiveProject } =
    useAppStore();
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
      <div className="flex min-h-[calc(100svh-3.5rem)] flex-1 items-center justify-center">
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

  function openProject(projectId: Id<"projects">) {
    setActiveProject(projectId);
    navigate({ to: "/board/$projectId", params: { projectId } });
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
      openProject(id as Id<"projects">);
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
      <EmptyTestimonial
        variant="workspace"
        title={
          <>
            Welcome to{" "}
            <Highlighter color="hsl(var(--primary) / 0.35)">CPipeLine</Highlighter>
          </>
        }
        description="Create your first workspace to organize projects and boards."
      >
        <form
          onSubmit={handleCreateWorkspace}
          className="mx-auto w-full max-w-sm space-y-4 text-left"
        >
          <div className="space-y-2">
            <Label>Workspace name</Label>
            <Input
              required
              placeholder="e.g. Acme Corp"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
            />
          </div>
          <Button
            className="w-full gap-2"
            type="submit"
            disabled={loading || !wsName.trim()}
          >
            <Plus className="size-4" />
            {loading ? "Creating…" : "Create workspace"}
          </Button>
        </form>
      </EmptyTestimonial>
    );
  }

  // Pick a workspace
  if (!activeWorkspaceId) {
    return (
      <PickerShell>
        <OrbitPicker
          items={workspaces.map((w) => ({ id: w._id, name: w.name }))}
          onSelect={(id) => setActiveWorkspace(id as Id<"workspaces">)}
          title={
            <>
              Choose a{" "}
              <Highlighter color="hsl(var(--primary) / 0.35)">workspace</Highlighter>
            </>
          }
          subtitle="Orbit through your teams — click a planet to continue."
        />
      </PickerShell>
    );
  }

  // Workspace selected but no projects
  if (projects && projects.length === 0) {
    return (
      <EmptyTestimonial
        variant="project"
        title={
          <>
            <Highlighter color="hsl(var(--primary) / 0.35)">
              {activeWorkspace?.name ?? "Workspace"}
            </Highlighter>{" "}
            is ready for its first board
          </>
        }
        description="Name a project and open your kanban in one step."
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
        <form
          onSubmit={handleCreateProject}
          className="mx-auto w-full max-w-sm space-y-4 text-left"
        >
          <div className="space-y-2">
            <Label>Project name</Label>
            <Input
              required
              placeholder="e.g. Website Redesign"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
            />
          </div>
          <Button
            className="w-full gap-2"
            type="submit"
            disabled={loading || !projName.trim()}
          >
            <Plus className="size-4" />
            {loading ? "Creating…" : "Create project"}
          </Button>
        </form>
      </EmptyTestimonial>
    );
  }

  // Pick a project
  if (projects && projects.length > 0) {
    return (
      <PickerShell>
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-6 top-6 z-20 text-muted-foreground"
          onClick={() => setActiveWorkspace(null)}
        >
          ← Change workspace
        </Button>
        <OrbitPicker
          items={projects.map((p) => ({ id: p._id, name: p.name }))}
          onSelect={(id) => openProject(id as Id<"projects">)}
          title={
            <>
              Open a{" "}
              <Highlighter color="hsl(var(--primary) / 0.35)">project</Highlighter>
            </>
          }
          subtitle={`Projects in ${activeWorkspace?.name ?? "your workspace"}`}
        />
      </PickerShell>
    );
  }

  return null;
}

function PickerShell({ children }: { children: ReactNode }) {
  return (
    <StarsShell className="relative">
      <div className="flex w-full flex-col items-center justify-center">
        {children}
      </div>
    </StarsShell>
  );
}

export default HomePage;
