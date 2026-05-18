import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { formatTagLabel, normalizeTag } from "@/lib/tag-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type OptionField = "status" | "priority";

const FIELD_TO_KEY = {
  status: "statusOptions",
  priority: "priorityOptions",
} as const;

interface ProjectOptionSelectProps {
  projectId: Id<"projects">;
  field: OptionField;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  canManage?: boolean;
}

export function ProjectOptionSelect({
  projectId,
  field,
  label,
  value,
  onChange,
  disabled,
  canManage = true,
}: ProjectOptionSelectProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const project = useQuery(api.projects.get, { projectId });
  const addOption = useMutation(api.projectFields.addOption);
  const removeOption = useMutation(api.projectFields.removeOption);

  const options =
    (project?.[FIELD_TO_KEY[field]] as string[] | undefined) ?? [];

  const displayValue = value ? formatTagLabel(value) : "None";

  async function handleAdd() {
    const normalized = normalizeTag(draft);
    if (!normalized) return;
    try {
      await addOption({ projectId, field, value: normalized });
      onChange(normalized);
      setDraft("");
      toast.success(`Added ${formatTagLabel(normalized)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add option");
    }
  }

  async function handleRemove(option: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await removeOption({ projectId, field, value: option });
      if (value === option) onChange("");
      toast.success(`Removed ${formatTagLabel(option)}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove option",
      );
    }
  }

  function selectOption(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full h-9 justify-between font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-1"
        >
          <ul className="max-h-56 overflow-y-auto">
            <li>
              <OptionRow
                selected={!value}
                onSelect={() => selectOption("")}
                label="None"
              />
            </li>
            {options.map((opt) => (
              <li key={opt}>
                <OptionRow
                  selected={value === opt}
                  onSelect={() => selectOption(opt)}
                  label={formatTagLabel(opt)}
                  onDelete={
                    canManage && !disabled
                      ? (e) => void handleRemove(opt, e)
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>

          {canManage && !disabled && (
            <div
              className="flex gap-2 border-t border-border/60 p-2 mt-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add option…"
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAdd();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-8 shrink-0"
                onClick={() => void handleAdd()}
                disabled={!draft.trim()}
                aria-label="Add option"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function OptionRow({
  label,
  selected,
  onSelect,
  onDelete,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-md hover:bg-muted/80">
      <button
        type="button"
        className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm min-w-0"
        onClick={onSelect}
      >
        <Check
          className={cn(
            "size-3.5 shrink-0",
            selected ? "opacity-100" : "opacity-0",
          )}
        />
        <span className="truncate">{label}</span>
      </button>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`Remove ${label}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
