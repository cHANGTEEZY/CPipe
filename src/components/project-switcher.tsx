import { useQuery, useMutation } from "convex/react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { api } from "@convex/_generated/api";
import { useAppStore } from "@/store/app-store";
import { useAppStoreHydrated } from "@/hooks/use-app-store-hydrated";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Plus, Kanban, Check, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Id } from "@convex/_generated/dataModel";
import { DeleteConfirmHost } from "@/components/delete-confirm-dialog";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";

export function ProjectSwitcher() {
  const hydrated = useAppStoreHydrated();
  const { activeWorkspaceId, activeProjectId, setActiveProject } = useAppStore();
  const projects = useQuery(
    api.projects.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip",
  );
  const createProject = useMutation(api.projects.create);
  const removeProject = useMutation(api.projects.remove);
  const deleteConfirm = useDeleteConfirm();

  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [pointsEnabled, setPointsEnabled] = useState(false);
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const boardMatch = pathname.match(/^\/board\/([^/]+)/);
  const projectIdFromUrl = boardMatch?.[1];

  const active =
    projects?.find((p) => p._id === activeProjectId) ??
    (projectIdFromUrl
      ? projects?.find((p) => p._id === projectIdFromUrl)
      : undefined);

  useEffect(() => {
    if (!hydrated || isHome || projects === undefined) return;

    if (projects.length === 0) {
      if (activeProjectId) {
        setActiveProject(null);
        if (boardMatch) {
          navigate({ to: "/", replace: true });
        }
      }
      return;
    }

    if (activeProjectId && projects.some((p) => p._id === activeProjectId)) {
      return;
    }

    if (projectIdFromUrl && projects.some((p) => p._id === projectIdFromUrl)) {
      setActiveProject(projectIdFromUrl as Id<"projects">);
      return;
    }

    const firstId = projects[0]._id as Id<"projects">;
    setActiveProject(firstId);
    if (boardMatch) {
      navigate({
        to: "/board/$projectId",
        params: { projectId: firstId },
        replace: true,
      });
    }
  }, [
    hydrated,
    isHome,
    projects,
    activeProjectId,
    projectIdFromUrl,
    boardMatch,
    setActiveProject,
    navigate,
  ]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !activeWorkspaceId) return;
    setCreating(true);
    try {
      const id = await createProject({
        workspaceId: activeWorkspaceId,
        name: newName.trim(),
        pointsEnabled,
      });
      setActiveProject(id as Id<"projects">);
      navigate({ to: "/board/$projectId", params: { projectId: id } });
      toast.success(`Project "${newName}" created`);
      setDialogOpen(false);
      setNewName("");
      setPointsEnabled(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create project";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  if (!activeWorkspaceId) return null;

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-10 px-3 gap-2 font-medium group-data-[collapsible=icon]:hidden"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Kanban className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm">
                {active?.name ?? "Select project"}
              </span>
            </div>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Projects
          </DropdownMenuLabel>
          {projects === undefined && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {projects?.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No projects yet
            </div>
          )}
          {projects?.map((p) => (
            <DropdownMenuItem
              key={p._id}
              onSelect={() => {
                setActiveProject(p._id);
                navigate({ to: "/board/$projectId", params: { projectId: p._id } });
                setOpen(false);
              }}
              className="gap-2 group/item"
            >
              <Kanban className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{p.name}</span>
              {p._id === activeProjectId && (
                <Check className="size-4 text-primary" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover/item:opacity-100 ml-1 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  deleteConfirm.request({
                    title: "Delete this project?",
                    description:
                      "The kanban board, checklist, and all cards in this project will be removed.",
                    itemName: p.name,
                    confirmLabel: "Delete project",
                    onConfirm: async () => {
                      try {
                        await removeProject({ projectId: p._id });
                        if (activeProjectId === p._id) setActiveProject(null);
                        toast.success(`Project "${p.name}" deleted`);
                      } catch (err: unknown) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : "Failed to delete project",
                        );
                        throw err;
                      }
                    },
                  });
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setOpen(false);
              setDialogOpen(true);
            }}
            className="gap-2 text-muted-foreground"
          >
            <Plus className="size-4" />
            New project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
        <Kanban className="size-5 text-muted-foreground" />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Project name</Label>
              <Input
                id="proj-name"
                placeholder="e.g. Website Redesign"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="points-toggle" className="text-sm">
                Enable story points
              </Label>
              <Switch
                id="points-toggle"
                checked={pointsEnabled}
                onCheckedChange={setPointsEnabled}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? "Creating…" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmHost {...deleteConfirm} />
    </>
  );
}
