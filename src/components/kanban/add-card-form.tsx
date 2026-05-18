import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { CustomTagField } from "./custom-tag-field";
import {
  LABEL_PRESETS,
  PRIORITY_PRESETS,
  STATUS_PRESETS,
} from "./card-tag-presets";

interface AddCardFormProps {
  columnId: Id<"columns">;
  projectId: Id<"projects">;
  onClose: () => void;
}

export function AddCardForm({ columnId, projectId, onClose }: AddCardFormProps) {
  const [title, setTitle] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const createCard = useMutation(api.cards.create);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Timeline is required");
      return;
    }

    setLoading(true);
    try {
      await createCard({
        columnId,
        projectId,
        title: title.trim(),
        labels,
        startDate: dateRange.from.getTime(),
        dueDate: dateRange.to.getTime(),
        status: status || undefined,
        priority: priority || undefined,
      });
      setTitle("");
      setDateRange(undefined);
      setStatus("");
      setPriority("");
      setLabels([]);
      inputRef.current?.focus();
      toast.success("Card created");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create card";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 p-3 rounded-xl bg-background/80 border border-border/50 shadow-xl backdrop-blur-md max-h-[70vh] overflow-y-auto"
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="h-9 text-sm focus-visible:ring-1 border-0 bg-muted/30 font-medium"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CustomTagField
          label="Status"
          presets={STATUS_PRESETS}
          value={status}
          onChange={setStatus}
        />
        <CustomTagField
          label="Priority"
          presets={PRIORITY_PRESETS}
          value={priority}
          onChange={setPriority}
        />
      </div>

      <CustomTagField
        mode="multi"
        label="Labels"
        presets={LABEL_PRESETS}
        values={labels}
        onChange={setLabels}
      />

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-wider">
          Timeline <span className="text-destructive">*</span>
        </label>
        <DateRangePicker
          date={dateRange}
          setDate={setDateRange}
          className="w-full h-8"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          disabled={loading || !title.trim()}
          className="flex-1 h-9 text-xs font-bold uppercase tracking-wide"
        >
          {loading ? "Adding…" : "Add Card"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
    </form>
  );
}
