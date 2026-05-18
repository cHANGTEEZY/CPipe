import { useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatTagLabel, normalizeTag } from "@/lib/tag-utils";

interface CustomTagFieldBase {
  label: string;
  presets: string[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

interface SingleTagFieldProps extends CustomTagFieldBase {
  mode?: "single";
  value: string;
  onChange: (value: string) => void;
}

interface MultiTagFieldProps extends CustomTagFieldBase {
  mode: "multi";
  values: string[];
  onChange: (values: string[]) => void;
}

export type CustomTagFieldProps = SingleTagFieldProps | MultiTagFieldProps;

export function CustomTagField(props: CustomTagFieldProps) {
  const {
    label,
    presets,
    disabled,
    required,
    className,
  } = props;
  const [draft, setDraft] = useState("");

  function addCustomTag() {
    const tag = normalizeTag(draft);
    if (!tag) return;

    if (props.mode === "multi") {
      if (!props.values.includes(tag)) {
        props.onChange([...props.values, tag]);
      }
    } else if (props.value !== tag) {
      props.onChange(tag);
    }
    setDraft("");
  }

  function onDraftKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  }

  const allOptions =
    props.mode === "multi"
      ? Array.from(new Set([...presets, ...props.values]))
      : Array.from(
          new Set([...presets, ...(props.value ? [props.value] : [])]),
        );

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>

      <div className="flex flex-wrap gap-2">
        {allOptions.map((tag) => {
          const selected =
            props.mode === "multi"
              ? props.values.includes(tag)
              : props.value === tag;

          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (props.mode === "multi") {
                  props.onChange(
                    selected
                      ? props.values.filter((v) => v !== tag)
                      : [...props.values, tag],
                  );
                } else {
                  props.onChange(selected ? "" : tag);
                }
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-all capitalize",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent bg-muted text-muted-foreground",
                !disabled && "hover:border-primary/30",
              )}
            >
              {formatTagLabel(tag)}
            </button>
          );
        })}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onDraftKeyDown}
            placeholder="Custom…"
            className="h-8 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1"
            onClick={addCustomTag}
            disabled={!draft.trim()}
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
