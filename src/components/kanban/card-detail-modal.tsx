import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@convex/utils";

const ALL_LABELS = ["bug", "feature", "design", "backend", "frontend", "docs"];

interface CardDetailModalProps {
  card: any;
  open: boolean;
  onClose: () => void;
}

export function CardDetailModal({ card, open, onClose }: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [points, setPoints] = useState(card.points?.toString() ?? "");
  const [labels, setLabels] = useState<string[]>(card.labels ?? []);
  const [saving, setSaving] = useState(false);

  const updateCard = useMutation(api.cards.update);
  const activity = useQuery(api.activity.list, { entityId: card._id, limit: 10 });

  async function handleSave() {
    setSaving(true);
    try {
      await updateCard({
        cardId: card._id,
        title: title.trim(),
        description: description.trim() || undefined,
        labels,
        points: points ? Number(points) : undefined,
      });
      toast.success("Card updated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  function toggleLabel(label: string) {
    setLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 mt-2">
          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize border-2 transition-all",
                    labels.includes(label)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent bg-muted text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Points */}
          <div className="space-y-2">
            <Label htmlFor="card-points">Story points</Label>
            <Input
              id="card-points"
              type="number"
              min={0}
              max={100}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="0"
              className="w-28"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>

          {/* Activity log */}
          {activity && activity.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="size-4" /> Activity
                </Label>
                <ul className="space-y-2">
                  {activity.map((log: any) => (
                    <li key={log._id} className="flex gap-2 text-sm">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {log.user?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{log.user?.name ?? "Someone"}</span>{" "}
                        <span className="text-muted-foreground">{log.action} this card</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {Math.round((Date.now() - log.createdAt) / 60000)}m ago
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
