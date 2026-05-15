import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ALL_LABELS = ["bug", "feature", "design", "backend", "frontend", "docs"];

interface SearchFilterBarProps {
  projectId: Id<"projects">;
  onFilter: (q: string, labels: string[]) => void;
}

export function SearchFilterBar({ projectId, onFilter }: SearchFilterBarProps) {
  const [query, setQuery] = useState("");
  const [activeLabels, setActiveLabels] = useState<string[]>([]);

  function update(q: string, lbls: string[]) {
    setQuery(q);
    setActiveLabels(lbls);
    onFilter(q, lbls);
  }

  function toggleLabel(label: string) {
    const next = activeLabels.includes(label)
      ? activeLabels.filter((l) => l !== label)
      : [...activeLabels, label];
    update(query, next);
  }

  function clear() {
    update("", []);
  }

  const hasFilters = query.trim().length > 0 || activeLabels.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search input */}
      <div className="relative flex-1 min-w-48 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => update(e.target.value, activeLabels)}
          placeholder="Search cards…"
          className="pl-9 h-9"
        />
        {query && (
          <button
            onClick={() => update("", activeLabels)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Label filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 h-9",
              activeLabels.length > 0 && "border-primary text-primary"
            )}
          >
            <Filter className="size-4" />
            Labels
            {activeLabels.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                {activeLabels.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Filter by label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ALL_LABELS.map((label) => (
            <DropdownMenuCheckboxItem
              key={label}
              checked={activeLabels.includes(label)}
              onCheckedChange={() => toggleLabel(label)}
              className="capitalize"
            >
              {label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active filter chips */}
      {activeLabels.map((label) => (
        <Badge
          key={label}
          variant="secondary"
          className="gap-1 cursor-pointer capitalize"
          onClick={() => toggleLabel(label)}
        >
          {label}
          <X className="size-3" />
        </Badge>
      ))}

      {/* Clear all */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-9 text-muted-foreground">
          Clear
        </Button>
      )}
    </div>
  );
}
