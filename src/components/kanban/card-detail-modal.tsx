import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
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
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALL_LABELS = ["bug", "feature", "design", "backend", "frontend", "docs"];

interface CardDetailModalProps {
  card: any;
  open: boolean;
  onClose: () => void;
  canWrite?: boolean;
}

export function CardDetailModal({ card, open, onClose, canWrite = true }: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [points, setPoints] = useState(card.points?.toString() ?? "");
  const [labels, setLabels] = useState<string[]>(card.labels ?? []);
  const [assigneeId, setAssigneeId] = useState<string>(card.assigneeId ?? "unassigned");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setDescription(card.description ?? "");
      setPoints(card.points?.toString() ?? "");
      setLabels(card.labels ?? []);
      setAssigneeId(card.assigneeId ?? "unassigned");
    }
  }, [open, card]);

  const updateCard = useMutation(api.cards.update);
  const activity = useQuery(api.activity.list, { entityId: card._id, limit: 10 });
  const project = useQuery(api.projects.get, { projectId: card.projectId });
  const members = useQuery(api.members.list, project?.workspaceId ? { workspaceId: project.workspaceId } : "skip");

  async function handleSave() {
    setSaving(true);
    try {
      await updateCard({
        cardId: card._id,
        title: title.trim(),
        description: description.trim() || undefined,
        labels,
        points: points ? Number(points) : undefined,
        assigneeId: assigneeId === "unassigned" ? null : (assigneeId as any),
      });
      toast.success("Card updated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  function toggleLabel(label: string) {
    if (!canWrite) return;
    setLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canWrite}
              className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent disabled:opacity-100"
            />
          </SheetTitle>
        </SheetHeader>

        <div className="grid gap-6">
          {/* Assignee */}
          <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center">
            <Label className="text-muted-foreground">Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="w-full">
                <div className="flex-1 truncate text-left pr-2">
                  <SelectValue placeholder="Unassigned" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members?.map((m: any) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    <span className="block truncate max-w-[200px] sm:max-w-[300px]">
                      {m.user?.name || m.user?.email || "Unknown User"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Points */}
          <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center">
            <Label htmlFor="card-points" className="text-muted-foreground">Story points</Label>
            <Input
              id="card-points"
              type="number"
              min={0}
              max={100}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              disabled={!canWrite}
              placeholder="0"
              className="w-28"
            />
          </div>

          {/* Labels */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">Labels</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  disabled={!canWrite}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize border transition-all",
                    labels.includes(label)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent bg-muted text-muted-foreground",
                    canWrite && "hover:border-primary/30"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canWrite}
              placeholder="Add a more detailed description…"
              className="min-h-[120px] resize-none break-all"
            />
          </div>

          {/* Save Action */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {canWrite || assigneeId !== (card.assigneeId ?? "unassigned") ? (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            ) : null}
          </div>

          {/* Activity log */}
          {activity && activity.length > 0 && (
            <div className="mt-4">
              <Separator className="mb-4" />
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" /> Activity
                </Label>
                <ul className="space-y-3">
                  {activity.map((log: any) => (
                    <li key={log._id} className="flex gap-3 text-sm">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {log.user?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p>
                          <span className="font-medium">{log.user?.name ?? "Someone"}</span>{" "}
                          <span className="text-muted-foreground">{log.action} this card</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((Date.now() - log.createdAt) / 60000)} minutes ago
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
