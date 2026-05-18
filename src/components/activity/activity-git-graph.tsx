import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ActivityLog = {
  _id: string;
  action: string;
  entityType: string;
  createdAt: number;
  targetName?: string;
  projectName?: string;
  projectId?: string;
  meta?: {
    fromColumnName?: string;
    toColumnName?: string;
    role?: string;
  };
  user?: {
    name?: string;
    profile?: { displayName?: string };
  };
};

const ROW_HEIGHT = 52;
const MIN_LANE_WIDTH = 56;
const LANE_WIDTH_PER_CHAR = 7;
const LABEL_ROW_HEIGHT = 32;
const GRAPH_PAD_X = 16;
const NODE_R = 7;

function computeLaneWidth(laneLabels: Map<number, string>) {
  let width = MIN_LANE_WIDTH;
  for (const label of laneLabels.values()) {
    width = Math.max(width, label.length * LANE_WIDTH_PER_CHAR + 20);
  }
  return Math.min(width, 112);
}

const ACTION_STYLE: Record<
  string,
  { fill: string; stroke: string; label: string; merge?: boolean }
> = {
  created: { fill: "#22c55e", stroke: "#16a34a", label: "Create" },
  deleted: { fill: "#ef4444", stroke: "#dc2626", label: "Delete" },
  moved: { fill: "#3b82f6", stroke: "#2563eb", label: "Move", merge: true },
  updated: { fill: "#f59e0b", stroke: "#d97706", label: "Update" },
  joined: { fill: "#a855f7", stroke: "#9333ea", label: "Join" },
  role_updated: { fill: "#ec4899", stroke: "#db2777", label: "Role" },
  removed: { fill: "#f97316", stroke: "#ea580c", label: "Remove" },
};

const LANE_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#8b5cf6",
  "#06b6d4",
];

type GraphNode = {
  log: ActivityLog;
  row: number;
  lane: number;
  mergeFrom?: number;
};

function laneX(lane: number, laneWidth: number) {
  return GRAPH_PAD_X + lane * laneWidth + laneWidth / 2;
}

function rowY(row: number) {
  return GRAPH_PAD_X + row * ROW_HEIGHT + ROW_HEIGHT / 2;
}

function actionStyle(action: string) {
  return ACTION_STYLE[action] ?? {
    fill: "hsl(var(--muted-foreground))",
    stroke: "hsl(var(--border))",
    label: action,
  };
}

export type ActivityGraphGroupBy = "project" | "column";

function laneKeyForLog(log: ActivityLog): string {
  if (log.entityType === "member" || !log.projectId) {
    return "workspace:members";
  }
  return `project:${log.projectId}`;
}

function laneLabelForLog(log: ActivityLog): string {
  if (log.entityType === "member" || !log.projectId) {
    return "Members";
  }
  return log.projectName ?? "Project";
}

function buildGraph(
  logs: ActivityLog[],
  groupBy: ActivityGraphGroupBy,
): {
  nodes: GraphNode[];
  laneCount: number;
  laneLabels: Map<number, string>;
} {
  const sorted = [...logs].sort((a, b) => b.createdAt - a.createdAt);
  const laneKeys = new Map<string, number>();
  const laneLabels = new Map<number, string>();
  let laneCount = 0;

  function ensureLane(key: string, label: string): number {
    if (!laneKeys.has(key)) {
      laneKeys.set(key, laneCount);
      laneLabels.set(laneCount, label);
      laneCount++;
    }
    return laneKeys.get(key)!;
  }

  const nodes: GraphNode[] = sorted.map((log, row) => {
    const useColumnLanes =
      groupBy === "column" &&
      log.action === "moved" &&
      log.meta?.fromColumnName &&
      log.meta?.toColumnName &&
      log.projectId;

    if (useColumnLanes) {
      const prefix = log.projectId!;
      const fromLane = ensureLane(
        `${prefix}:col:${log.meta!.fromColumnName}`,
        log.meta!.fromColumnName!,
      );
      const toLane = ensureLane(
        `${prefix}:col:${log.meta!.toColumnName}`,
        log.meta!.toColumnName!,
      );
      return { log, row, lane: toLane, mergeFrom: fromLane };
    }

    const lane = ensureLane(laneKeyForLog(log), laneLabelForLog(log));
    return { log, row, lane };
  });

  return { nodes, laneCount, laneLabels };
}

function buildRails(nodes: GraphNode[], laneWidth: number) {
  const segments: { x1: number; y1: number; x2: number; y2: number; lane: number }[] =
    [];
  const laneLastRow = new Map<number, number>();

  for (const node of nodes) {
    const x = laneX(node.lane, laneWidth);
    const y = rowY(node.row);

    if (laneLastRow.has(node.lane)) {
      const prevRow = laneLastRow.get(node.lane)!;
      segments.push({
        x1: x,
        y1: rowY(prevRow) + NODE_R,
        x2: x,
        y2: y - NODE_R,
        lane: node.lane,
      });
    }
    laneLastRow.set(node.lane, node.row);

    if (node.mergeFrom !== undefined && node.mergeFrom !== node.lane) {
      const xFrom = laneX(node.mergeFrom, laneWidth);
      segments.push({
        x1: xFrom,
        y1: y,
        x2: x,
        y2: y,
        lane: node.mergeFrom,
      });
      if (!laneLastRow.has(node.mergeFrom)) {
        laneLastRow.set(node.mergeFrom, node.row);
      }
    }
  }

  return { segments };
}

function getActionText(log: ActivityLog): string {
  const userName =
    log.user?.profile?.displayName ?? log.user?.name ?? "Someone";
  const target = log.targetName ?? "item";
  const type = log.entityType === "card" ? "task" : log.entityType;

  switch (log.action) {
    case "created":
      return `${userName} created ${type} "${target}"`;
    case "deleted":
      return `${userName} deleted ${type} "${target}"`;
    case "moved":
      return `${userName} moved "${target}" ${log.meta?.fromColumnName ?? "?"} → ${log.meta?.toColumnName ?? "?"}`;
    case "updated":
      return `${userName} updated ${type} "${target}"`;
    case "joined":
      return `${userName} joined as ${log.meta?.role ?? "member"}`;
    case "role_updated":
      return `${userName} changed ${target}'s role to ${log.meta?.role ?? "member"}`;
    case "removed":
      return `${userName} removed ${target}`;
    default:
      return `${userName} ${log.action} ${type} "${target}"`;
  }
}

function GraphLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {Object.entries(ACTION_STYLE).map(([key, s]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full ring-1 ring-black/10"
            style={{ background: s.fill, boxShadow: `0 0 0 1px ${s.stroke}` }}
          />
          <span>{s.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <svg width="28" height="10" className="text-blue-500">
          <path
            d="M 0 5 C 8 5, 20 5, 28 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span>Merge / move</span>
      </div>
    </div>
  );
}

export function ActivityGitGraph({
  logs,
  groupBy = "project",
}: {
  logs: ActivityLog[];
  /** project = one lane per project (best for All Projects). column = lanes per board column (single project). */
  groupBy?: ActivityGraphGroupBy;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { nodes, laneLabels, laneWidth, graphWidth, svgHeight } =
    useMemo(() => {
      const graph = buildGraph(logs, groupBy);
      const width = computeLaneWidth(graph.laneLabels);
      const gWidth = Math.max(
        GRAPH_PAD_X * 2 + Math.max(graph.laneCount, 1) * width,
        120,
      );
      const svgHeight = Math.max(
        GRAPH_PAD_X * 2 + graph.nodes.length * ROW_HEIGHT,
        ROW_HEIGHT + GRAPH_PAD_X * 2,
      );
      return {
        ...graph,
        laneWidth: width,
        graphWidth: gWidth,
        graphHeight: LABEL_ROW_HEIGHT + svgHeight,
        svgHeight,
      };
    }, [logs, groupBy]);

  const { segments } = useMemo(
    () => buildRails(nodes, laneWidth),
    [nodes, laneWidth],
  );

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
        No activity to graph yet
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <GraphLegend />

        <div className="rounded-xl border bg-card/50 overflow-hidden">
          <div className="flex min-h-0">
            {/* Git graph column */}
            <div
              className="shrink-0 border-r bg-muted/20 overflow-x-auto"
              style={{ minWidth: graphWidth }}
            >
              <div
                className="flex border-b border-border/50 bg-muted/40 box-border"
                style={{
                  width: graphWidth,
                  minHeight: LABEL_ROW_HEIGHT,
                  paddingLeft: GRAPH_PAD_X,
                  paddingRight: GRAPH_PAD_X,
                }}
              >
                {Array.from(laneLabels.entries())
                  .sort(([a], [b]) => a - b)
                  .map(([lane, label]) => (
                    <div
                      key={lane}
                      className="flex items-center justify-center px-1 py-2 shrink-0"
                      style={{ width: laneWidth }}
                      title={label}
                    >
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground truncate w-full text-center leading-tight">
                        {label}
                      </span>
                    </div>
                  ))}
              </div>

              <svg
                width={graphWidth}
                height={svgHeight}
                className="block"
                aria-hidden
              >
                {/* Vertical + merge rails */}
                {segments.map((seg, i) => {
                  const isMerge = seg.y1 === seg.y2;
                  const color =
                    LANE_PALETTE[seg.lane % LANE_PALETTE.length];
                  if (isMerge) {
                    const midX = (seg.x1 + seg.x2) / 2;
                    return (
                      <path
                        key={i}
                        d={`M ${seg.x1} ${seg.y1} C ${midX} ${seg.y1 + 14}, ${midX} ${seg.y2 + 14}, ${seg.x2} ${seg.y2}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={2.5}
                        opacity={0.85}
                      />
                    );
                  }
                  return (
                    <line
                      key={i}
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      stroke={color}
                      strokeWidth={2}
                      opacity={0.5}
                    />
                  );
                })}

                {/* Commit nodes */}
                {nodes.map((node) => {
                  const style = actionStyle(node.log.action);
                  const x = laneX(node.lane, laneWidth);
                  const y = rowY(node.row);
                  const isMerge = style.merge;
                  const isHovered = hoveredId === node.log._id;

                  return (
                    <g
                      key={node.log._id}
                      transform={`translate(${x}, ${y})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredId(node.log._id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {isMerge ? (
                        <polygon
                          points={`0,-${NODE_R} ${NODE_R},0 0,${NODE_R} -${NODE_R},0`}
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth={isHovered ? 2.5 : 1.5}
                          className="transition-all"
                        />
                      ) : (
                        <circle
                          r={NODE_R}
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth={isHovered ? 2.5 : 1.5}
                          className="transition-all"
                        />
                      )}
                      {isHovered && (
                        <circle
                          r={NODE_R + 4}
                          fill="none"
                          stroke={style.fill}
                          strokeWidth={1}
                          opacity={0.4}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Commit messages (like git log) */}
            <div className="flex-1 min-w-0">
              {nodes.map((node) => {
                const style = actionStyle(node.log.action);
                const isHovered = hoveredId === node.log._id;

                return (
                  <Tooltip key={node.log._id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-start gap-3 px-4 border-b border-border/50 transition-colors",
                          isHovered && "bg-accent/50",
                        )}
                        style={{ height: ROW_HEIGHT }}
                        onMouseEnter={() => setHoveredId(node.log._id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <div className="flex flex-col justify-center min-w-0 flex-1 py-1">
                          <p className="text-sm leading-snug truncate">
                            <span
                              className="font-mono text-[11px] font-semibold mr-2"
                              style={{ color: style.fill }}
                            >
                              {style.label}
                            </span>
                            <span className="text-muted-foreground">
                              {getActionText(node.log)}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">
                            {formatDistanceToNow(node.log.createdAt, {
                              addSuffix: true,
                            })}
                            {node.log.projectName && (
                              <span className="ml-2 opacity-70">
                                · {node.log.projectName}
                              </span>
                            )}
                          </p>
                        </div>
                        {node.log.action === "moved" && (
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[9px] uppercase border-blue-500/30 text-blue-600 dark:text-blue-400"
                          >
                            merge
                          </Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs text-xs">
                      {getActionText(node.log)}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lane color key */}
        <div className="flex flex-wrap gap-2 px-1">
          {Array.from(laneLabels.entries()).map(([lane, label]) => (
            <div
              key={lane}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
            >
              <span
                className="w-3 h-0.5 rounded-full"
                style={{
                  background: LANE_PALETTE[lane % LANE_PALETTE.length],
                }}
              />
              <span className="truncate max-w-[120px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
