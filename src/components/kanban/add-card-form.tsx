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

interface AddCardFormProps {
  columnId: Id<"columns">;
  projectId: Id<"projects">;
  onClose: () => void;
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Activity as ActivityIcon } from "lucide-react";

export function AddCardForm({ columnId, projectId, onClose }: AddCardFormProps) {
  const [title, setTitle] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [status, setStatus] = useState<string>("on_track");
  const [priority, setPriority] = useState<string>("medium");
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
      await createCard({ 
        columnId, 
        projectId, 
        title: title.trim(), 
        labels: [],
        startDate: dateRange?.from ? dateRange.from.getTime() : undefined,
        dueDate: dateRange?.to ? dateRange.to.getTime() : undefined,
        status: status as any,
        priority: priority as any,
      });
      setTitle("");
      setDateRange(undefined);
      inputRef.current?.focus();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create card");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 rounded-xl bg-background/80 border border-border/50 shadow-xl backdrop-blur-md">
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
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-wider">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 text-[11px] bg-muted/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on_track">On Track</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
              <SelectItem value="off_track">Off Track</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-wider">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 text-[11px] bg-muted/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-wider">Timeline</label>
        <DateRangePicker 
          date={dateRange} 
          setDate={setDateRange} 
          className="w-full h-8"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={loading || !title.trim()} className="flex-1 h-9 text-xs font-bold uppercase tracking-wide">
          {loading ? "Adding…" : "Add Card"}
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
    </form>
  );
}
