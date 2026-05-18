import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Id } from "@convex/_generated/dataModel";
const NONE = "__none__";

interface CardDependencyFieldsProps {
  columns: { _id: Id<"columns">; name: string }[];
  projectCards: { _id: Id<"cards">; title: string }[];
  excludeCardId?: Id<"cards">;
  dependsOnCardId: string;
  dependsOnColumnId: string;
  onDependsOnCardChange: (id: string) => void;
  onDependsOnColumnChange: (id: string) => void;
  disabled?: boolean;
}

export function CardDependencyFields({
  columns,
  projectCards,
  excludeCardId,
  dependsOnCardId,
  dependsOnColumnId,
  onDependsOnCardChange,
  onDependsOnColumnChange,
  disabled,
}: CardDependencyFieldsProps) {
  const taskOptions = projectCards.filter((c) => c._id !== excludeCardId);

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
      <div>
        <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
          Dependency (optional)
        </Label>
        <p className="text-[11px] text-muted-foreground mt-1">
          This task cannot be moved until its dependency reaches the selected column.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Depends on task</Label>
        <Select
          value={dependsOnCardId || NONE}
          onValueChange={(v) => {
            const next = v === NONE ? "" : v;
            onDependsOnCardChange(next);
            if (!next) onDependsOnColumnChange("");
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="No dependency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No dependency</SelectItem>
            {taskOptions.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {dependsOnCardId && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Required column for dependency
          </Label>
          <Select
            value={dependsOnColumnId || NONE}
            onValueChange={(v) =>
              onDependsOnColumnChange(v === NONE ? "" : v)
            }
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Select column…</SelectItem>
              {columns.map((col) => (
                <SelectItem key={col._id} value={col._id}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
