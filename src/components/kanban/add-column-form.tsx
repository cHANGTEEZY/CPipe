import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface AddColumnFormProps {
  projectId: Id<"projects">;
}

export function AddColumnForm({ projectId }: AddColumnFormProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const createColumn = useMutation(api.columns.create);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createColumn({ projectId, name: name.trim() });
      setName("");
      setEditing(false);
      toast.success("Column added");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add column");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <Button
        variant="ghost"
        onClick={() => setEditing(true)}
        className="w-72 shrink-0 h-12 justify-start gap-2 border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="size-4" />
        Add column
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-72 shrink-0 flex flex-col gap-2 rounded-xl border bg-muted/30 p-3"
    >
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Column name…"
        className="h-8 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setEditing(false);
            setName("");
          }
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading || !name.trim()} className="flex-1">
          {loading ? "Adding…" : "Add column"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setEditing(false);
            setName("");
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    </form>
  );
}
