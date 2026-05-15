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
import { ChevronsUpDown, Plus, Building2, Check } from "lucide-react";
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
import type { Id } from "../../convex/_generated/dataModel";

export function OrgSwitcher() {
  const workspaces = useQuery(api.workspaces.list) ?? [];
  const createWorkspace = useMutation(api.workspaces.create);
  const { activeWorkspaceId, setActiveWorkspace } = useAppStore();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const active = workspaces.find((w: any) => w._id === activeWorkspaceId) ?? workspaces[0];

  // Auto-select first workspace if none active
  if (!activeWorkspaceId && workspaces.length > 0) {
    setActiveWorkspace(workspaces[0]._id as Id<"workspaces">);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createWorkspace({ name: newName.trim() });
      setActiveWorkspace(id as Id<"workspaces">);
      toast.success(`Workspace "${newName}" created`);
      setDialogOpen(false);
      setNewName("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-10 px-3 gap-2 font-medium group-data-[collapsible=icon]:hidden"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                {active?.name?.[0]?.toUpperCase() ?? "W"}
              </div>
              <span className="truncate text-sm">{active?.name ?? "Select workspace"}</span>
            </div>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Workspaces
          </DropdownMenuLabel>
          {workspaces.map((ws: any) => (
            <DropdownMenuItem
              key={ws._id}
              onSelect={() => {
                setActiveWorkspace(ws._id);
                setOpen(false);
              }}
              className="gap-2"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
                {ws.name[0].toUpperCase()}
              </div>
              <span className="flex-1 truncate">{ws.name}</span>
              {ws._id === activeWorkspaceId && (
                <Check className="size-4 text-primary" />
              )}
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
            New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Icon-collapsed state */}
      <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
        <div className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
          {active?.name?.[0]?.toUpperCase() ?? <Building2 className="size-4" />}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                placeholder="e.g. Acme Corp"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
