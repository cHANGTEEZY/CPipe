import type { ReactNode } from "react"
import { OrbitingCircles } from "@/components/ui/orbiting-circles"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface OrbitPickerItem {
  id: string
  name: string
}

interface OrbitPickerProps {
  items: OrbitPickerItem[]
  onSelect: (id: string) => void
  title: ReactNode
  subtitle?: string
  className?: string
}

function OrbitNode({
  item,
  onSelect,
}: {
  item: OrbitPickerItem
  onSelect: (id: string) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            "flex size-full cursor-pointer items-center justify-center rounded-full",
            "border-2 border-border bg-card shadow-md transition-all duration-200",
            "hover:scale-110 hover:border-primary hover:shadow-lg hover:ring-2 hover:ring-primary/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <span className="text-sm font-bold text-foreground">
            {item.name[0]?.toUpperCase() ?? "?"}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={10} className="font-medium">
        {item.name}
      </TooltipContent>
    </Tooltip>
  )
}

export function OrbitPicker({
  items,
  onSelect,
  title,
  subtitle,
  className,
}: OrbitPickerProps) {
  const count = items.length
  const iconSize = count <= 4 ? 56 : count <= 8 ? 48 : 40
  const radius = count <= 4 ? 130 : count <= 8 ? 150 : 170
  const innerRadius = Math.round(radius * 0.55)
  const orbitSize = radius * 2 + iconSize

  const useDualOrbit = count > 4
  const inner = useDualOrbit ? items.slice(0, Math.ceil(count / 2)) : []
  const outer = useDualOrbit ? items.slice(Math.ceil(count / 2)) : items

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={0}>
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-6 py-8",
        className
      )}
    >
      <div className="text-center space-y-2 px-4 max-w-md">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div
        className="relative flex items-center justify-center"
        style={{ width: orbitSize, height: orbitSize }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none z-10">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Click to select
          </p>
        </div>

        {useDualOrbit && inner.length > 0 ? (
          <>
            <OrbitingCircles
              radius={radius}
              iconSize={iconSize}
              duration={28}
              speed={0.85}
              pathClassName="dark:stroke-white/20 stroke-black/20"
            >
              {outer.map((item) => (
                <OrbitNode key={item.id} item={item} onSelect={onSelect} />
              ))}
            </OrbitingCircles>
            <OrbitingCircles
              radius={innerRadius}
              iconSize={iconSize - 8}
              duration={18}
              reverse
              path
              pathClassName="dark:stroke-primary/40 stroke-primary/30 [stroke-dasharray:4_6]"
            >
              {inner.map((item) => (
                <OrbitNode key={item.id} item={item} onSelect={onSelect} />
              ))}
            </OrbitingCircles>
          </>
        ) : (
          <OrbitingCircles
            radius={radius}
            iconSize={iconSize}
            duration={22}
            pathClassName="dark:stroke-white/20 stroke-black/20"
          >
            {items.map((item) => (
              <OrbitNode key={item.id} item={item} onSelect={onSelect} />
            ))}
          </OrbitingCircles>
        )}
      </div>

      <ul className="flex flex-wrap justify-center gap-2 max-w-lg px-4">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium transition-colors hover:bg-primary/10 hover:border-primary/40"
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
    </TooltipProvider>
  )
}
