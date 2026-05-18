import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { formatTagLabel, normalizeTag } from "@/lib/tag-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProjectLabelSelectProps {
  projectId: Id<"projects">;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  canManage?: boolean;
}

export function ProjectLabelSelect({
  projectId,
  values,
  onChange,
  disabled,
  canManage = true,
}: ProjectLabelSelectProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const project = useQuery(api.projects.get, { projectId });
  const addOption = useMutation(api.projectFields.addOption);
  const removeOption = useMutation(api.projectFields.removeOption);

  const options = project?.labelOptions ?? [];

  function toggleLabel(tag: string) {
    if (values.includes(tag)) {
      onChange(values.filter((v) => v !== tag));
    } else {
      onChange([...values, tag]);
    }
  }

  async function handleAddCustom() {
    const normalized = normalizeTag(draft);
    if (!normalized) return;
    try {
      await addOption({ projectId, field: "label", value: normalized });
      if (!values.includes(normalized)) {
        onChange([...values, normalized]);
      }
      setDraft("");
      toast.success(`Added ${formatTagLabel(normalized)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add label");
    }
  }

  async function handleRemoveFromProject(option: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await removeOption({ projectId, field: "label", value: option });
      onChange(values.filter((v) => v !== option));
      toast.success(`Removed ${formatTagLabel(option)}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove label",
      );
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
        Labels
      </Label>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {formatTagLabel(tag)}
              {!disabled && (
                <button
                  type="button"
                  className="rounded-full hover:bg-muted p-0.5"
                  onClick={() => toggleLabel(tag)}
                  aria-label={`Remove ${formatTagLabel(tag)} from card`}
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full h-9 justify-between font-normal text-muted-foreground"
            >
              <span>Add or manage labels…</span>
              <ChevronDown className="size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] p-1"
          >
            {options.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No labels yet. Add one below.
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto">
                {options.map((opt) => {
                  const selected = values.includes(opt);
                  return (
                    <li key={opt}>
                      <div className="flex items-center gap-0.5 rounded-md hover:bg-muted/80">
                        <button
                          type="button"
                          className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm min-w-0"
                          onClick={() => toggleLabel(opt)}
                        >
                          <Check
                            className={cn(
                              "size-3.5 shrink-0",
                              selected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="truncate">
                            {formatTagLabel(opt)}
                          </span>
                        </button>
                        {canManage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={(e) => void handleRemoveFromProject(opt, e)}
                            aria-label={`Delete ${formatTagLabel(opt)} from project`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {canManage && (
              <div
                className="flex gap-2 border-t border-border/60 p-2 mt-1"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add label…"
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAddCustom();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-8 shrink-0"
                  onClick={() => void handleAddCustom()}
                  disabled={!draft.trim()}
                  aria-label="Add label"
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
