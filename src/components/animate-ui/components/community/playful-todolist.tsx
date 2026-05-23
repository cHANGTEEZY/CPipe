'use client';

import type { ReactNode } from 'react';
import { motion, type Transition } from 'motion/react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export type PlayfulTodoItem = {
  id: string;
  label: string;
  completed: boolean;
};

type PlayfulTodolistProps = {
  items: PlayfulTodoItem[];
  onToggleComplete?: (id: string, completed: boolean) => void;
  readOnly?: boolean;
  className?: string;
  emptyMessage?: string;
  renderActions?: (item: PlayfulTodoItem) => ReactNode;
};

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

function PlayfulTodolist({
  items,
  onToggleComplete,
  readOnly = false,
  className,
  emptyMessage = 'No items yet — add one above.',
  renderActions,
}: PlayfulTodolistProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-4 sm:p-6 space-y-4',
        className,
      )}
    >
      {items.map((item, idx) => (
        <div key={item.id} className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={item.completed}
              disabled={readOnly || !onToggleComplete}
              onCheckedChange={(val) => {
                if (readOnly || !onToggleComplete) return;
                onToggleComplete(item.id, val === true);
              }}
              id={`playful-checkbox-${item.id}`}
              className="shrink-0"
            />
            <div className="relative flex-1 min-w-0 py-0.5">
              <Label
                htmlFor={`playful-checkbox-${item.id}`}
                className={cn(
                  'block text-sm font-semibold leading-snug pr-1 cursor-pointer',
                  item.completed && 'text-muted-foreground',
                )}
              >
                {item.label}
              </Label>
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
                  animate={getPathAnimate(item.completed)}
                  transition={getPathTransition(item.completed)}
                  className="stroke-foreground/85 dark:stroke-foreground"
                />
              </motion.svg>
            </div>
            {renderActions ? (
              <div className="flex items-center gap-0.5 shrink-0">
                {renderActions(item)}
              </div>
            ) : null}
          </div>
          {idx !== items.length - 1 ? (
            <div className="border-t border-neutral-300/80 dark:border-neutral-700" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export { PlayfulTodolist };
