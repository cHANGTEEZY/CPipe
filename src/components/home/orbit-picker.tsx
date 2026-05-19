import type { ReactNode } from "react"
import { OrbitingCircles } from "@/components/ui/orbiting-circles"
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
  planetSize,
}: {
  item: OrbitPickerItem
  onSelect: (id: string) => void
  planetSize: number
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={cn(
        "flex h-full w-full cursor-pointer flex-col items-center justify-start gap-1.5",
        "rounded-lg bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          "border-2 border-border bg-card shadow-md transition-all duration-200",
          "hover:scale-110 hover:border-primary hover:shadow-lg hover:ring-2 hover:ring-primary/30"
        )}
        style={{ width: planetSize, height: planetSize }}
      >
        <span className="text-sm font-bold text-foreground">
          {item.name[0]?.toUpperCase() ?? "?"}
        </span>
      </span>
      <span className="max-w-[5.5rem] truncate text-center text-[11px] font-medium leading-tight text-foreground">
        {item.name}
      </span>
    </button>
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
  const planetSize = count <= 4 ? 64 : count <= 8 ? 56 : 48
  const labelHeight = 20
  const iconSize = planetSize + labelHeight + 8
  const radius = count <= 4 ? 165 : count <= 8 ? 185 : 205
  const innerRadius = Math.round(radius * 0.55)
  const orbitSize = radius * 2 + iconSize

  const useDualOrbit = count > 4
  const inner = useDualOrbit ? items.slice(0, Math.ceil(count / 2)) : []
  const outer = useDualOrbit ? items.slice(Math.ceil(count / 2)) : items

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-8",
        className
      )}
    >
      <div className="space-y-2 px-4 max-w-md text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div
        className="relative flex items-center justify-center overflow-visible"
        style={{ width: orbitSize, height: orbitSize }}
      >
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
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
                <OrbitNode
                  key={item.id}
                  item={item}
                  onSelect={onSelect}
                  planetSize={planetSize}
                />
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
                <OrbitNode
                  key={item.id}
                  item={item}
                  onSelect={onSelect}
                  planetSize={planetSize - 8}
                />
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
              <OrbitNode
                key={item.id}
                item={item}
                onSelect={onSelect}
                planetSize={planetSize}
              />
            ))}
          </OrbitingCircles>
        )}
      </div>
    </div>
  )
}
