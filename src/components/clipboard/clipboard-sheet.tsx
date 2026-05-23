import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckSquare,
  ExternalLink,
  Kanban,
  Link2,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PinList,
  type PinListItem,
} from "@/components/animate-ui/components/community/pin-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/store/app-store";

function kindIcon(kind: Doc<"clipboardItems">["kind"]) {
  switch (kind) {
    case "card":
      return Kanban;
    case "link":
      return Link2;
    default:
      return CheckSquare;
  }
}

function kindInfo(item: Doc<"clipboardItems">) {
  switch (item.kind) {
    case "card":
      return "Kanban card";
    case "link":
      return item.url ?? "Link";
    default:
      return item.completed ? "Done" : "Checklist item";
  }
}

function ClipboardSheet() {
  const { clipboardOpen, setClipboardOpen } = useAppStore();
  const navigate = useNavigate();
  const items = useQuery(api.clipboard.list);
  const updateItem = useMutation(api.clipboard.update);
  const removeItem = useMutation(api.clipboard.remove);
  const addQuickNote = useMutation(api.clipboard.addQuickNote);
  const addLink = useMutation(api.clipboard.addLink);

  const [note, setNote] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);

  const grouped = useMemo(() => {
    if (!items) return [];
    const map = new Map<string, Doc<"clipboardItems">[]>();
    for (const item of items) {
      const key = item.sourceLabel;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  function toPinItems(groupItems: Doc<"clipboardItems">[]): PinListItem[] {
    return groupItems.map((item) => ({
      id: item._id,
      name: item.title,
      info: kindInfo(item),
      icon: kindIcon(item.kind),
      pinned: item.pinned,
      completed: item.completed,
    }));
  }

  async function handleToggleComplete(
    itemId: string,
    completed: boolean,
  ) {
    try {
      await updateItem({
        itemId: itemId as Id<"clipboardItems">,
        completed,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleTogglePin(itemId: string) {
    const item = items?.find((i) => i._id === itemId);
    if (!item) return;
    try {
      await updateItem({
        itemId: item._id,
        pinned: !item.pinned,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleRemove(itemId: string) {
    try {
      await removeItem({ itemId: itemId as Id<"clipboardItems"> });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await addQuickNote({ title: note.trim() });
      setNote("");
      toast.success("Added to clipboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    try {
      await addLink({ title: linkTitle.trim(), url: linkUrl.trim() });
      setLinkTitle("");
      setLinkUrl("");
      setShowLinkForm(false);
      toast.success("Link added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add link");
    }
  }

  function openSource(item: Doc<"clipboardItems">) {
    if (item.kind === "link" && item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (item.sourceProjectId) {
      setClipboardOpen(false);
      if (item.kind === "card") {
        navigate({
          to: "/board/$projectId",
          params: { projectId: item.sourceProjectId },
        });
      } else {
        navigate({
          to: "/board/$projectId/checklist",
          params: { projectId: item.sourceProjectId },
        });
      }
    }
  }

  return (
    <Sheet open={clipboardOpen} onOpenChange={setClipboardOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Clipboard</SheetTitle>
          <SheetDescription>
            Pin, check off, and open saved items from any workspace.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-8 py-4">
          {items === undefined ? (
            <p className="text-sm text-muted-foreground text-center">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 rounded-2xl border border-dashed bg-neutral-100 dark:bg-neutral-900">
              Nothing saved yet. Add a note below or send items from a project
              checklist or kanban card.
            </p>
          ) : (
            grouped.map(([label, groupItems]) => (
              <section key={label} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3">
                  {label}
                </h3>
                <PinList
                  items={toPinItems(groupItems)}
                  layoutIdPrefix={label.replace(/\s+/g, "-")}
                  onTogglePin={handleTogglePin}
                  onToggleComplete={handleToggleComplete}
                  labels={{
                    pinned: "Pinned",
                    unpinned: "Saved items",
                  }}
                  renderTrailing={(pinItem) => {
                    const raw = groupItems.find((i) => i._id === pinItem.id);
                    if (!raw) return null;
                    const canOpen = !!(raw.sourceProjectId || raw.url);
                    return (
                      <>
                        {canOpen && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title="Open"
                            onClick={() => openSource(raw)}
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemove(pinItem.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    );
                  }}
                />
              </section>
            ))
          )}
        </div>

        <div className="shrink-0 space-y-3 border-t pt-4">
          <form onSubmit={handleAddNote} className="flex gap-2">
            <Input
              placeholder="Quick note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!note.trim()}>
              Add
            </Button>
          </form>

          {showLinkForm ? (
            <form
              onSubmit={handleAddLink}
              className="space-y-2 rounded-lg border p-3"
            >
              <div className="space-y-1">
                <Label htmlFor="clip-link-title" className="text-xs">
                  Title
                </Label>
                <Input
                  id="clip-link-title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Docs, Figma…"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="clip-link-url" className="text-xs">
                  URL
                </Label>
                <Input
                  id="clip-link-url"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!linkTitle.trim() || !linkUrl.trim()}
                >
                  Save link
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLinkForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowLinkForm(true)}
            >
              <Link2 className="size-4 mr-2" />
              Add link
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { ClipboardSheet };
