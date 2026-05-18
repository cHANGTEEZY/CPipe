import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { ProjectOptionSelect } from "./project-option-select";
import { ProjectLabelSelect } from "./project-label-select";
import { CardDependencyFields } from "./card-dependency-fields";

interface AddCardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: Id<"columns">;
  projectId: Id<"projects">;
  columnName: string;
}

const emptyForm = () => ({
  title: "",
  description: "",
  dateRange: undefined as DateRange | undefined,
  status: "",
  priority: "",
  labels: [] as string[],
  assigneeId: "unassigned",
  dependsOnCardId: "",
  dependsOnColumnId: "",
});

export function AddCardSheet({
  open,
  onOpenChange,
  columnId,
  projectId,
  columnName,
}: AddCardSheetProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const createCard = useMutation(api.cards.create);
  const columns = useQuery(api.columns.list, { projectId }) ?? [];
  const projectCards = useQuery(api.cards.listByProject, { projectId }) ?? [];
  const project = useQuery(api.projects.get, { projectId });
  const members = useQuery(
    api.members.list,
    project?.workspaceId ? { workspaceId: project.workspaceId } : "skip",
  );
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.dateRange?.from || !form.dateRange?.to) {
      toast.error("Timeline is required");
      return;
    }
    if (form.dependsOnCardId && !form.dependsOnColumnId) {
      toast.error("Select the required column for the dependency");
      return;
    }

    setLoading(true);
    try {
      await createCard({
        columnId,
        projectId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assigneeId:
          form.assigneeId === "unassigned"
            ? undefined
            : (form.assigneeId as Id<"users">),
        labels: form.labels,
        startDate: form.dateRange.from.getTime(),
        dueDate: form.dateRange.to.getTime(),
        status: form.status || undefined,
        priority: form.priority || undefined,
        dependsOnCardId: form.dependsOnCardId
          ? (form.dependsOnCardId as Id<"cards">)
          : undefined,
        dependsOnColumnId: form.dependsOnColumnId
          ? (form.dependsOnColumnId as Id<"columns">)
          : undefined,
      });
      toast.success("Card created");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create card");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-[600px] overflow-y-auto p-0 flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 flex-1">
            <SheetHeader className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Add to {columnName}
              </p>
              <SheetTitle className="mt-1">
                <Input
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="What needs to be done?"
                  className="text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                />
              </SheetTitle>
            </SheetHeader>

            <div className="grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProjectOptionSelect
                  projectId={projectId}
                  field="status"
                  label="Status"
                  value={form.status}
                  onChange={(status) => setForm((f) => ({ ...f, status }))}
                />
                <ProjectOptionSelect
                  projectId={projectId}
                  field="priority"
                  label="Priority"
                  value={form.priority}
                  onChange={(priority) => setForm((f) => ({ ...f, priority }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                  Assignee
                </Label>
                <Select
                  value={form.assigneeId}
                  onValueChange={(assigneeId) =>
                    setForm((f) => ({ ...f, assigneeId }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members?.map((m: {
                      userId: string;
                      user?: {
                        profile?: { displayName?: string };
                        name?: string;
                        email?: string;
                      };
                    }) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user?.profile?.displayName ||
                          m.user?.name ||
                          m.user?.email ||
                          "Unknown User"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                  Timeline <span className="text-destructive">*</span>
                </Label>
                <DateRangePicker
                  date={form.dateRange}
                  setDate={(dateRange) => setForm((f) => ({ ...f, dateRange }))}
                  className="w-full"
                />
              </div>

              <ProjectLabelSelect
                projectId={projectId}
                values={form.labels}
                onChange={(labels) => setForm((f) => ({ ...f, labels }))}
              />

              <CardDependencyFields
                columns={columns}
                projectCards={projectCards}
                dependsOnCardId={form.dependsOnCardId}
                dependsOnColumnId={form.dependsOnColumnId}
                onDependsOnCardChange={(dependsOnCardId) =>
                  setForm((f) => ({ ...f, dependsOnCardId }))
                }
                onDependsOnColumnChange={(dependsOnColumnId) =>
                  setForm((f) => ({ ...f, dependsOnColumnId }))
                }
              />

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                  Description
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Add a more detailed description…"
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t bg-background p-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.title.trim()}>
              {loading ? "Creating…" : "Create card"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
