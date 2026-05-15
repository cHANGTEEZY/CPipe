import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { toast } from "sonner";

interface AddCardFormProps {
  columnId: Id<"columns">;
  projectId: Id<"projects">;
  onClose: () => void;
}

export function AddCardForm({ columnId, projectId, onClose }: AddCardFormProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const createCard = useMutation(api.cards.create);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createCard({ columnId, projectId, title: title.trim(), labels: [] });
      setTitle("");
      inputRef.current?.focus();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create card");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title…"
        className="h-8 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading || !title.trim()} className="flex-1">
          {loading ? "Adding…" : "Add"}
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
    </form>
  );
}
