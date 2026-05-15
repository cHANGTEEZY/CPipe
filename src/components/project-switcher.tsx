import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAppStore } from "@/store/app-store";
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
import { useState } from "react";
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
import type { Id } from "../../convex/_generated/dataModel";

export function ProjectSwitcher() {
  const { activeWorkspaceId, activeProjectId, setActiveProject } = useAppStore();
  const projects = useQuery(
    api.projects.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? [];
  const createProject = useMutation(api.projects.create);
  const removeProject = useMutation(api.projects.remove);

  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [pointsEnabled, setPointsEnabled] = useState(false);
  const [creating, setCreating] = useState(false);

  const active = projects.find((p: any) => p._id === activeProjectId) ?? projects[0];

  // Auto-select first project
  if (!activeProjectId && projects.length > 0 && !active) {
    setActiveProject(projects[0]._id as Id<"projects">);
  }

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
      toast.success(`Project "${newName}" created`);
      setDialogOpen(false);
      setNewName("");
      setPointsEnabled(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(projectId: Id<"projects">, name: string) {
    try {
      await removeProject({ projectId });
      if (activeProjectId === projectId) setActiveProject(null);
      toast.success(`Project "${name}" deleted`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete project");
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
          {projects.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No projects yet
            </div>
          )}
          {projects.map((p: any) => (
            <DropdownMenuItem
              key={p._id}
              onSelect={() => {
                setActiveProject(p._id);
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
                  handleDelete(p._id, p.name);
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

      {/* Icon-collapsed state */}
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
    </>
  );
}
