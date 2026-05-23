'use client';

import * as React from 'react';
import { Pin } from 'lucide-react';
import {
  motion,
  LayoutGroup,
  AnimatePresence,
  type HTMLMotionProps,
  type Transition,
} from 'motion/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getPathAnimate = (isChecked: boolean) => ({
  pathLength: isChecked ? 1 : 0,
  opacity: isChecked ? 1 : 0,
});

const getPathTransition = (isChecked: boolean): Transition => ({
  pathLength: { duration: 0.55, ease: 'easeInOut' },
  opacity: {
    duration: 0.01,
    delay: isChecked ? 0 : 0.5,
  },
});

type PinListItem = {
  id: string;
  name: string;
  info: string;
  icon: React.ElementType;
  pinned: boolean;
  completed?: boolean;
};

type PinListProps = {
  items: PinListItem[];
  onTogglePin?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
  /** Use hand-drawn strikethrough when completing (best for task rows). */
  playfulCheckoff?: boolean;
  readOnly?: boolean;
  layoutIdPrefix?: string;
  renderTrailing?: (item: PinListItem) => React.ReactNode;
  labels?: {
    pinned?: string;
    unpinned?: string;
  };
  transition?: Transition;
  labelMotionProps?: HTMLMotionProps<'p'>;
  className?: string;
  labelClassName?: string;
  pinnedSectionClassName?: string;
  unpinnedSectionClassName?: string;
  zIndexResetDelay?: number;
  emptyMessage?: string;
} & HTMLMotionProps<'div'>;

function PinListRow({
  item,
  layoutId,
  transition,
  readOnly,
  onTogglePin,
  onToggleComplete,
  playfulCheckoff,
  renderTrailing,
}: {
  item: PinListItem;
  layoutId: string;
  transition: Transition;
  readOnly: boolean;
  onTogglePin?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
  playfulCheckoff?: boolean;
  renderTrailing?: (item: PinListItem) => React.ReactNode;
}) {
  const completed = item.completed ?? false;
  const showInfo = Boolean(item.info);

  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={transition}
      className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-200 dark:bg-neutral-800 p-2 group"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {onToggleComplete && (
          <Checkbox
            checked={completed}
            disabled={readOnly}
            onCheckedChange={(val) =>
              onToggleComplete(item.id, val === true)
            }
            aria-label={`Mark ${item.name} complete`}
            className="shrink-0"
          />
        )}
        <div className="rounded-lg bg-background p-2 shrink-0">
          <item.icon className="size-5 text-neutral-500 dark:text-neutral-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative py-0.5">
            <p
              className={cn(
                'text-sm font-semibold truncate pr-1',
                completed &&
                  !playfulCheckoff &&
                  'line-through text-muted-foreground',
                completed && playfulCheckoff && 'text-muted-foreground',
              )}
            >
              {item.name}
            </p>
            {onToggleComplete && playfulCheckoff && (
              <motion.svg
                width="100%"
                height="24"
                viewBox="0 0 340 24"
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none h-6 w-full overflow-visible"
              >
                <motion.path
                  d="M 4 12 s 40 -6 55 -6 c 12 0 -24 8 -17 11 c 8 4 62 -14 67 -8 c 4 5 -13 8 2 9 c 10 1 48 -10 48 -10"
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeMiterlimit={10}
                  fill="none"
                  initial={false}
                  animate={getPathAnimate(completed)}
                  transition={getPathTransition(completed)}
                  className="stroke-foreground/85 dark:stroke-foreground"
                />
              </motion.svg>
            )}
          </div>
          {showInfo ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
              {item.info}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {renderTrailing?.(item)}
        {onTogglePin && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={readOnly}
            title={item.pinned ? 'Unpin' : 'Pin'}
            className={cn(
              'size-8 rounded-full shrink-0 transition-colors',
              item.pinned
                ? 'bg-neutral-500 dark:bg-neutral-600 text-white hover:bg-neutral-600 dark:hover:bg-neutral-500'
                : 'bg-neutral-300/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 opacity-70 group-hover:opacity-100 hover:bg-neutral-400 dark:hover:bg-neutral-600 hover:text-white',
            )}
            onClick={() => {
              if (readOnly) return;
              onTogglePin(item.id);
            }}
          >
            <Pin
              className={cn('size-4', item.pinned && 'fill-current')}
            />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function PinList({
  items,
  onTogglePin,
  onToggleComplete,
  playfulCheckoff = false,
  readOnly = false,
  layoutIdPrefix = '',
  renderTrailing,
  labels = { pinned: 'Pinned', unpinned: 'Tap pin to prioritize' },
  transition = { stiffness: 320, damping: 20, mass: 0.8, type: 'spring' },
  labelMotionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.22, ease: 'easeInOut' },
  },
  className,
  labelClassName,
  pinnedSectionClassName,
  unpinnedSectionClassName,
  zIndexResetDelay = 500,
  emptyMessage,
  ...props
}: PinListProps) {
  const [togglingGroup, setTogglingGroup] = React.useState<
    'pinned' | 'unpinned' | null
  >(null);

  const pinned = items.filter((u) => u.pinned);
  const unpinned = items.filter((u) => !u.pinned);

  const layoutPrefix = layoutIdPrefix ? `${layoutIdPrefix}-` : '';

  const toggleStatus = (id: string) => {
    if (readOnly || !onTogglePin) return;
    const item = items.find((u) => u.id === id);
    if (!item) return;

    setTogglingGroup(item.pinned ? 'pinned' : 'unpinned');
    onTogglePin(id);
    setTimeout(() => setTogglingGroup(null), zIndexResetDelay);
  };

  if (items.length === 0 && emptyMessage) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8 rounded-2xl border border-dashed bg-neutral-100 dark:bg-neutral-900">
        {emptyMessage}
      </p>
    );
  }

  return (
    <motion.div className={cn('space-y-8', className)} {...props}>
      <LayoutGroup id={layoutIdPrefix || 'pin-list'}>
        <div>
          {pinned.length > 0 && (
            <div
              className={cn(
                'space-y-3 relative',
                togglingGroup === 'pinned' ? 'z-[5]' : 'z-10',
                pinnedSectionClassName,
              )}
            >
              <AnimatePresence>
                {labels.pinned && (
                  <motion.p
                    layout
                    key="pinned-label"
                    className={cn(
                      'font-medium px-3 text-neutral-500 dark:text-neutral-300 text-sm mb-2',
                      labelClassName,
                    )}
                    {...labelMotionProps}
                  >
                    {labels.pinned}
                  </motion.p>
                )}
              </AnimatePresence>
              {pinned.map((item) => (
                <PinListRow
                  key={item.id}
                  item={item}
                  layoutId={`${layoutPrefix}item-${item.id}`}
                  transition={transition}
                  readOnly={readOnly}
                  onTogglePin={toggleStatus}
                  onToggleComplete={onToggleComplete}
                  playfulCheckoff={playfulCheckoff}
                  renderTrailing={renderTrailing}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <AnimatePresence>
            {unpinned.length > 0 && labels.unpinned && (
              <motion.p
                layout
                key="all-label"
                className={cn(
                  'font-medium px-3 text-neutral-500 dark:text-neutral-300 text-sm mb-2',
                  labelClassName,
                )}
                {...labelMotionProps}
              >
                {labels.unpinned}
              </motion.p>
            )}
          </AnimatePresence>
          {unpinned.length > 0 && (
            <div
              className={cn(
                'space-y-3 relative',
                togglingGroup === 'unpinned' ? 'z-[5]' : 'z-10',
                unpinnedSectionClassName,
              )}
            >
              {unpinned.map((item) => (
                <PinListRow
                  key={item.id}
                  item={item}
                  layoutId={`${layoutPrefix}item-${item.id}`}
                  transition={transition}
                  readOnly={readOnly}
                  onTogglePin={toggleStatus}
                  onToggleComplete={onToggleComplete}
                  playfulCheckoff={playfulCheckoff}
                  renderTrailing={renderTrailing}
                />
              ))}
            </div>
          )}
        </div>
      </LayoutGroup>
    </motion.div>
  );
}

export { PinList, type PinListProps, type PinListItem };
