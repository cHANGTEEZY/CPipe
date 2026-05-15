'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type HexagonBackgroundProps = React.ComponentProps<'div'> & {
  hexagonProps?: React.ComponentProps<'div'>;
  hexagonSize?: number; // value greater than 50
  hexagonMargin?: number;
};

function HexagonBackground({
  className,
  children,
  hexagonProps,
  hexagonSize = 75,
  hexagonMargin = 3,
  ...props
}: HexagonBackgroundProps) {
  const hexagonWidth = hexagonSize;
  const hexagonHeight = hexagonSize * 1.1;
  const rowSpacing = hexagonSize * 0.8;
  const baseMarginTop = -36 - 0.275 * (hexagonSize - 100);
  const computedMarginTop = baseMarginTop + hexagonMargin;
  const oddRowMarginLeft = -(hexagonSize / 2);
  const evenRowMarginLeft = hexagonMargin / 2;

  const [gridDimensions, setGridDimensions] = React.useState({
    rows: 0,
    columns: 0,
  });

  const containerRef = React.useRef<HTMLDivElement>(null);

  const updateGridDimensions = React.useCallback(() => {
    const el = containerRef.current;
    const fallbackW =
      typeof window !== 'undefined' ? window.innerWidth : 480;
    const fallbackH =
      typeof window !== 'undefined' ? window.innerHeight : 800;
    const w = el?.clientWidth ?? fallbackW;
    const h = el?.clientHeight ?? fallbackH;
    const rows = Math.max(8, Math.ceil(h / rowSpacing));
    const columns = Math.ceil(w / hexagonWidth) + 2;
    setGridDimensions({ rows, columns });
  }, [rowSpacing, hexagonWidth]);

  React.useEffect(() => {
    updateGridDimensions();
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener('resize', updateGridDimensions, opts);
    const node = containerRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' && node
        ? new ResizeObserver(() => updateGridDimensions())
        : null;
    ro?.observe(node);
    return () => {
      window.removeEventListener('resize', updateGridDimensions, opts);
      ro?.disconnect();
    };
  }, [updateGridDimensions]);

  return (
    <div
      ref={containerRef}
      data-slot="hexagon-background"
      className={cn(
        'relative size-full overflow-hidden bg-muted dark:bg-muted/70',
        className,
      )}
      {...props}
    >
      <style>{`[data-slot="hexagon-background"] { --hexagon-margin: ${hexagonMargin}px; }`}</style>
      <div className="absolute top-0 -left-0 size-full overflow-hidden">
        {Array.from({ length: gridDimensions.rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            style={{
              marginTop: computedMarginTop,
              marginLeft:
                ((rowIndex + 1) % 2 === 0
                  ? evenRowMarginLeft
                  : oddRowMarginLeft) - 10,
            }}
            className="inline-flex"
          >
            {Array.from({ length: gridDimensions.columns }).map(
              (_, colIndex) => (
                <div
                  key={`hexagon-${rowIndex}-${colIndex}`}
                  {...hexagonProps}
                  style={{
                    width: hexagonWidth,
                    height: hexagonHeight,
                    marginLeft: hexagonMargin,
                    ...hexagonProps?.style,
                  }}
                  className={cn(
                    'relative',
                    '[clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)]',
                    "before:content-[''] before:absolute before:inset-0 before:w-full before:h-full before:bg-background before:opacity-100 before:transition-all before:duration-1000 dark:before:bg-card",
                    "after:content-[''] after:absolute after:inset-[var(--hexagon-margin)] after:bg-background dark:after:bg-card",
                    'after:[clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)]',
                    'hover:before:bg-accent/80 dark:hover:before:bg-accent/90 hover:before:duration-150 hover:after:bg-accent hover:after:duration-150 dark:hover:after:bg-accent/80',
                    hexagonProps?.className,
                  )}
                />
              ),
            )}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

export { HexagonBackground, type HexagonBackgroundProps };
