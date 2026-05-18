import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { formatTagLabel, normalizeTag } from "@/lib/tag-utils";
import { toast } from "sonner";

const NONE = "__none__";

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
  const [draft, setDraft] = useState("");
  const project = useQuery(api.projects.get, { projectId });
  const addOption = useMutation(api.projectFields.addOption);
  const removeOption = useMutation(api.projectFields.removeOption);

  const options =
    (project?.[FIELD_TO_KEY[field]] as string[] | undefined) ?? [];

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

  async function handleRemove(option: string) {
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

  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
        {label}
      </Label>
      <Select
        value={value || NONE}
        onValueChange={(v) => onChange(v === NONE ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full h-9">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>None</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {formatTagLabel(opt)}
            </SelectItem>
          ))}

          {canManage && !disabled && (
            <>
              <SelectSeparator />
              <div
                className="p-2 space-y-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <p className="text-[10px] font-semibold uppercase text-muted-foreground px-1">
                  Manage options
                </p>
                <motion.div className="flex gap-2">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="New option…"
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
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0"
                    onClick={() => void handleAdd()}
                    disabled={!draft.trim()}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </motion.div>
                {options.length > 0 && (
                  <ul className="max-h-32 overflow-y-auto space-y-1">
                    {options.map((opt) => (
                      <li
                        key={opt}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs hover:bg-muted"
                      >
                        <span>{formatTagLabel(opt)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 text-destructive hover:text-destructive"
                          onClick={() => void handleRemove(opt)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </>
          )}
        </SelectContent>
      </Select>
    </motion.div>
  );
}
