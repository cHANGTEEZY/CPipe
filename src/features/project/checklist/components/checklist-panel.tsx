import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Checklist } from "@/components/checklist/checklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TodoScope = "project" | "personal";

type ChecklistPanelProps = {
  projectId: Id<"projects">;
  scope: TodoScope;
  canEdit: boolean;
};

function ChecklistPanel({ projectId, scope, canEdit }: ChecklistPanelProps) {
  const todos = useQuery(api.projectTodos.list, { projectId, scope });
  const createTodo = useMutation(api.projectTodos.create);
  const updateTodo = useMutation(api.projectTodos.update);
  const removeTodo = useMutation(api.projectTodos.remove);
  const addToClipboard = useMutation(api.clipboard.addTodo);

  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const items = useMemo(() => {
    if (!todos) return [];
    return todos.map((t: Doc<"projectTodos">) => ({
      id: t._id,
      title: t.title,
      completed: t.completed,
      pinned: t.pinned,
    }));
  }, [todos]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || !newTitle.trim()) return;
    setAdding(true);
    try {
      await createTodo({ projectId, scope, title: newTitle.trim() });
      setNewTitle("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleComplete(id: string, completed: boolean) {
    try {
      await updateTodo({
        todoId: id as Id<"projectTodos">,
        completed,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleTogglePin(id: string) {
    const todo = todos?.find((t) => t._id === id);
    if (!todo) return;
    try {
      await updateTodo({ todoId: todo._id, pinned: !todo.pinned });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update pin");
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeTodo({ todoId: id as Id<"projectTodos"> });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  async function handleAddToClipboard(id: string) {
    try {
      await addToClipboard({ todoId: id as Id<"projectTodos"> });
      toast.success("Added to clipboard");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add to clipboard",
      );
    }
  }

  if (todos === undefined) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Loading…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Add an item…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={adding || !newTitle.trim()}>
            Add
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          View-only — editors can add team items.
        </p>
      )}

      <Checklist
        items={items}
        canEdit={canEdit}
        onToggleComplete={handleToggleComplete}
        onTogglePin={handleTogglePin}
        onRemove={handleRemove}
        onAddToClipboard={handleAddToClipboard}
      />
    </div>
  );
}

export { ChecklistPanel };
