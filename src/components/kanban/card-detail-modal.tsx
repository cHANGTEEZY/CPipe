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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectOptionSelect } from "./project-option-select";
import { ProjectLabelSelect } from "./project-label-select";
import { CardDependencyFields } from "./card-dependency-fields";
import { MessageSquare, Clock, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import type { Id } from "@convex/_generated/dataModel";

interface CardDetailModalProps {
  card: any;
  open: boolean;
  onClose: () => void;
  canWrite?: boolean;
}

import { formatDistanceToNow } from "date-fns";

export function CardDetailModal({
  card,
  open,
  onClose,
  canWrite = true,
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [labels, setLabels] = useState<string[]>(card.labels ?? []);
  const [assigneeId, setAssigneeId] = useState<string>(
    card.assigneeId ?? "unassigned",
  );
  const [status, setStatus] = useState<string>(card.status ?? "");
  const [priority, setPriority] = useState<string>(card.priority ?? "");
  const [dependsOnCardId, setDependsOnCardId] = useState<string>(
    card.dependsOnCardId ?? "",
  );
  const [dependsOnColumnId, setDependsOnColumnId] = useState<string>(
    card.dependsOnColumnId ?? "",
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: card.startDate ? new Date(card.startDate) : undefined,
    to: card.dueDate ? new Date(card.dueDate) : undefined,
  });
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setDescription(card.description ?? "");
      setLabels(card.labels ?? []);
      setAssigneeId(card.assigneeId ?? "unassigned");
      setStatus(card.status ?? "");
      setPriority(card.priority ?? "");
      setDependsOnCardId(card.dependsOnCardId ?? "");
      setDependsOnColumnId(card.dependsOnColumnId ?? "");
      setDateRange({
        from: card.startDate ? new Date(card.startDate) : undefined,
        to: card.dueDate ? new Date(card.dueDate) : undefined,
      });
    }
  }, [open, card]);

  const updateCard = useMutation(api.cards.update);
  const addComment = useMutation(api.comments.create);
  const deleteComment = useMutation(api.comments.remove);

  const comments = useQuery(api.comments.list, { cardId: card._id });
  const activity = useQuery(api.activity.list, {
    entityId: card._id,
    limit: 20,
  });
  const project = useQuery(api.projects.get, { projectId: card.projectId });
  const columns = useQuery(api.columns.list, { projectId: card.projectId }) ?? [];
  const projectCards =
    useQuery(api.cards.listByProject, { projectId: card.projectId }) ?? [];
  const members = useQuery(
    api.members.list,
    project?.workspaceId ? { workspaceId: project.workspaceId } : "skip",
  );

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (dependsOnCardId && !dependsOnColumnId) {
      toast.error("Select the required column for the dependency");
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Timeline is required");
      return;
    }
    setSaving(true);
    try {
      await updateCard({
        cardId: card._id,
        title: title.trim(),
        description: description.trim(),
        labels,
        assigneeId:
          assigneeId === "unassigned"
            ? null
            : (assigneeId as Id<"users">),
        startDate: dateRange.from.getTime(),
        dueDate: dateRange.to.getTime(),
        status: status || null,
        priority: priority || null,
        dependsOnCardId: dependsOnCardId
          ? (dependsOnCardId as Id<"cards">)
          : null,
        dependsOnColumnId: dependsOnColumnId
          ? (dependsOnColumnId as Id<"columns">)
          : null,
      });
      toast.success("Card updated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      await addComment({ cardId: card._id, content: newComment.trim() });
      setNewComment("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add comment");
    } finally {
      setCommenting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent 
        className="w-full sm:max-w-[600px] overflow-y-auto p-0 flex flex-col gap-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-6 pb-0">
          <SheetHeader className="mb-6">
            <SheetTitle>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canWrite}
                className="text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent disabled:opacity-100"
              />
            </SheetTitle>
          </SheetHeader>

          <div className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProjectOptionSelect
                projectId={card.projectId}
                field="status"
                label="Status"
                value={status}
                onChange={setStatus}
                disabled={!canWrite}
                canManage={canWrite}
              />
              <ProjectOptionSelect
                projectId={card.projectId}
                field="priority"
                label="Priority"
                value={priority}
                onChange={setPriority}
                disabled={!canWrite}
                canManage={canWrite}
              />
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                  Assignee
                </Label>
                <Select
                  value={assigneeId}
                  onValueChange={setAssigneeId}
                  disabled={!canWrite}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex-1 truncate text-left">
                      <SelectValue placeholder="Unassigned" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members?.map((m: any) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        <span className="block truncate">
                          {m.user?.profile?.displayName ||
                            m.user?.name ||
                            m.user?.email ||
                            "Unknown User"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                Timeline <span className="text-destructive">*</span>
              </Label>
              <DateRangePicker
                date={dateRange}
                setDate={setDateRange}
                className="w-full"
              />
            </div>

            <ProjectLabelSelect
              projectId={card.projectId}
              values={labels}
              onChange={setLabels}
              disabled={!canWrite}
              canManage={canWrite}
            />

            <CardDependencyFields
              columns={columns}
              projectCards={projectCards}
              excludeCardId={card._id}
              dependsOnCardId={dependsOnCardId}
              dependsOnColumnId={dependsOnColumnId}
              onDependsOnCardChange={setDependsOnCardId}
              onDependsOnColumnChange={setDependsOnColumnId}
              disabled={!canWrite}
            />

            {/* Description */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canWrite}
                placeholder="Add a more detailed description…"
                className="min-h-[100px] resize-none break-all"
              />
            </div>

            {/* Save Action */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} size="sm">
                Close
              </Button>
              {canWrite && (
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs for Comments and Activity */}
        <div className="mt-12 flex-1 flex flex-col min-h-[500px] bg-muted/20 border-t">
          <Tabs
            defaultValue="comments"
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="px-6 border-b bg-background/50">
              <TabsList className="h-12 bg-transparent gap-6 p-0">
                <TabsTrigger
                  value="comments"
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
                >
                  <MessageSquare className="size-4 mr-2" /> Comments
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 px-1.5 min-w-5 justify-center"
                  >
                    {comments?.length ?? 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
                >
                  <Clock className="size-4 mr-2" /> Activity
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="comments"
              className="flex-1 flex flex-col min-h-0 m-0 p-6 pt-4 overflow-y-auto"
            >
              {/* Comment input */}
              <form onSubmit={handleAddComment} className="mb-6 space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] bg-background text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={commenting || !newComment.trim()}
                  >
                    <Send className="size-3 mr-2" />{" "}
                    {commenting ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-6">
                {comments?.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No comments yet. Be the first to chime in!
                  </p>
                ) : (
                  comments?.map((comment: any) => (
                    <div key={comment._id} className="group flex gap-4">
                      <div className="size-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {(
                          comment.user?.profile?.displayName?.[0] ??
                          comment.user?.name?.[0] ??
                          "?"
                        ).toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">
                            {comment.user?.profile?.displayName ??
                              comment.user?.name ??
                              "Someone"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(comment.createdAt, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                      {canWrite &&
                        comment.userId === (card.createdBy || "") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              deleteComment({ commentId: comment._id })
                            }
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="activity"
              className="flex-1 m-0 p-6 pt-4 overflow-y-auto"
            >
              <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-muted/50">
                {activity?.map((log: any) => (
                  <li key={log._id} className="relative pl-8">
                    <div className="absolute left-0 top-1 size-6 rounded-full bg-background border flex items-center justify-center z-10">
                      <div className="size-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-bold">
                          {log.user?.profile?.displayName ??
                            log.user?.name ??
                            "Someone"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {log.action}{" "}
                          {log.entityType === "card"
                            ? "this card"
                            : log.entityType}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {formatDistanceToNow(log.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
