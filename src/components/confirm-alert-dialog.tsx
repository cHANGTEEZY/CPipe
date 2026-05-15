/* eslint-disable react-refresh/only-export-components -- compound component module */
"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

// ─── Context ─────────────────────────────────────────────────────────────────

type ConfirmAlertContextValue = {
  phrase: string | null;
  registerPhrase: (phrase: string) => void;
  unregisterPhrase: () => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  confirmationMet: boolean;
};

const ConfirmAlertContext = createContext<ConfirmAlertContextValue | null>(null);

function useConfirmAlert(component: string) {
  const ctx = useContext(ConfirmAlertContext);
  if (!ctx) {
    throw new Error(
      `${component} must be used inside ConfirmAlertDialog.Content`,
    );
  }
  return ctx;
}

function ConfirmPhraseProvider({ children }: { children: ReactNode }) {
  const [phrase, setPhrase] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const registerPhrase = useCallback((p: string) => {
    setPhrase(p);
    setInputValue("");
  }, []);
  const unregisterPhrase = useCallback(() => {
    setPhrase(null);
    setInputValue("");
  }, []);
  const confirmationMet = useMemo(
    () => (phrase === null ? true : inputValue.trim() === phrase.trim()),
    [phrase, inputValue],
  );
  const value = useMemo<ConfirmAlertContextValue>(
    () => ({
      phrase,
      registerPhrase,
      unregisterPhrase,
      inputValue,
      setInputValue,
      confirmationMet,
    }),
    [
      phrase,
      registerPhrase,
      unregisterPhrase,
      inputValue,
      confirmationMet,
    ],
  );
  return (
    <ConfirmAlertContext.Provider value={value}>
      {children}
    </ConfirmAlertContext.Provider>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

type ConfirmAlertDialogRootProps = ComponentPropsWithoutRef<typeof AlertDialog>;

function ConfirmAlertDialogRoot(props: ConfirmAlertDialogRootProps) {
  return <AlertDialog {...props} />;
}

// ─── Content (centered modal + phrase provider) ──────────────────────────────

type ConfirmAlertDialogContentProps = ComponentPropsWithoutRef<
  typeof AlertDialogContent
>;

const ConfirmAlertDialogContent = forwardRef<
  HTMLDivElement,
  ConfirmAlertDialogContentProps
>(({ className, children, ...props }, ref) => (
  <AlertDialogContent
    ref={ref}
    className={cn("text-pretty", className)}
    {...props}
  >
    <ConfirmPhraseProvider>{children}</ConfirmPhraseProvider>
  </AlertDialogContent>
));
ConfirmAlertDialogContent.displayName = "ConfirmAlertDialog.Content";

// ─── Icon (optional) ─────────────────────────────────────────────────────────

type ConfirmAlertDialogIconProps = HTMLAttributes<HTMLDivElement>;

function ConfirmAlertDialogIcon({
  className,
  children,
  ...props
}: ConfirmAlertDialogIconProps) {
  return (
    <div
      data-slot="confirm-alert-icon"
      className={cn(
        "flex justify-center text-destructive [&_svg]:size-9 [&_svg]:shrink-0 sm:[&_svg]:size-10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Header (title + description stack) ─────────────────────────────────────

type ConfirmAlertDialogHeaderProps = HTMLAttributes<HTMLDivElement>;

function ConfirmAlertDialogHeader({
  className,
  ...props
}: ConfirmAlertDialogHeaderProps) {
  return (
    <AlertDialogHeader
      className={cn("space-y-2 sm:space-y-3", className)}
      {...props}
    />
  );
}

// ─── Title / Description (re-export Radix wrappers from ui) ────────────────

const ConfirmAlertDialogTitle = AlertDialogTitle;
const ConfirmAlertDialogDescription = AlertDialogDescription;

// ─── Typed confirmation field ────────────────────────────────────────────────

type ConfirmAlertDialogConfirmationProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  "value" | "onChange"
> & {
  match: string;
  label?: ReactNode;
  hint?: ReactNode;
};

function ConfirmAlertDialogConfirmation({
  match,
  label,
  hint,
  id: idProp,
  className,
  ...inputProps
}: ConfirmAlertDialogConfirmationProps) {
  const autoId = useId();
  const id = idProp ?? `${autoId}-confirm-alert`;
  const { registerPhrase, unregisterPhrase, inputValue, setInputValue } =
    useConfirmAlert("ConfirmAlertDialog.Confirmation");

  useEffect(() => {
    if (!match.trim()) {
      console.warn("ConfirmAlertDialog.Confirmation: `match` should be non-empty.");
    }
    registerPhrase(match);
    return () => unregisterPhrase();
  }, [match, registerPhrase, unregisterPhrase]);

  return (
    <div
      data-slot="confirm-alert-confirmation"
      className="mt-6 w-full space-y-2 text-left"
    >
      {label !== undefined ? (
        <Label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}
        </Label>
      ) : (
        <Label htmlFor={id} className="text-xs font-medium text-foreground">
          Type <span className="font-mono text-xs">{match}</span> to confirm
        </Label>
      )}
      <Input
        id={id}
        value={inputValue}
        autoComplete="off"
        aria-invalid={
          match.trim().length > 0 &&
          inputValue.length > 0 &&
          inputValue.trim() !== match.trim()
            ? true
            : undefined
        }
        onChange={(e) => setInputValue(e.target.value)}
        className={cn("h-11 w-full font-mono text-sm", className)}
        {...inputProps}
      />
      {hint !== undefined ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          The destructive action stays disabled until the text matches exactly.
        </p>
      )}
    </div>
  );
}

// ─── Actions row / stack ─────────────────────────────────────────────────────

type ConfirmAlertDialogActionsProps = HTMLAttributes<HTMLDivElement> & {
  /** `row` = side-by-side on sm+; `stack` = full-width column; `stack-destructive-first` = primary action on top */
  layout?: "row" | "stack" | "stack-destructive-first";
};

function ConfirmAlertDialogActions({
  layout = "row",
  className,
  ...props
}: ConfirmAlertDialogActionsProps) {
  return (
    <div
      data-slot="confirm-alert-actions"
      className={cn(
        "mt-8 w-full",
        layout === "row" &&
          "flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3 [&>button]:h-11 [&>button]:w-full [&>button]:cursor-pointer sm:[&>button]:flex-1 [&>button]:disabled:cursor-not-allowed",
        layout === "stack" &&
          "flex flex-col gap-2 [&>button]:h-11 [&>button]:w-full [&>button]:cursor-pointer [&>button]:disabled:cursor-not-allowed",
        layout === "stack-destructive-first" &&
          "flex flex-col-reverse gap-2 [&>button]:h-11 [&>button]:w-full [&>button]:cursor-pointer [&>button]:disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

// ─── Cancel (closes dialog) ──────────────────────────────────────────────────

type ConfirmAlertDialogCancelProps = ButtonProps;

const ConfirmAlertDialogCancel = forwardRef<
  HTMLButtonElement,
  ConfirmAlertDialogCancelProps
>(
  (
    { className, variant = "outline", type = "button", ...props },
    ref: ForwardedRef<HTMLButtonElement>,
  ) => (
    <AlertDialogCancel ref={ref} asChild>
      <Button
        variant={variant}
        type={type}
        className={cn("cursor-pointer disabled:cursor-not-allowed", className)}
        {...props}
      />
    </AlertDialogCancel>
  ),
);
ConfirmAlertDialogCancel.displayName = "ConfirmAlertDialog.Cancel";

// ─── Primary / destructive action (closes on success; optional typed gate) ───

type ConfirmAlertDialogActionProps = ButtonProps & {
  requiresMatch?: boolean;
};

const ConfirmAlertDialogAction = forwardRef<
  HTMLButtonElement,
  ConfirmAlertDialogActionProps
>(
  (
    {
      requiresMatch = false,
      disabled,
      variant = "destructive",
      className,
      type = "button",
      ...props
    },
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    const { phrase, confirmationMet } = useConfirmAlert("ConfirmAlertDialog.Action");
    const blockedByMatch =
      requiresMatch && (phrase === null || !confirmationMet);

    return (
      <AlertDialogAction asChild>
        <Button
          ref={ref}
          variant={variant}
          type={type}
          disabled={Boolean(disabled) || blockedByMatch}
          className={cn(
            "cursor-pointer disabled:cursor-not-allowed aria-disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
      </AlertDialogAction>
    );
  },
);
ConfirmAlertDialogAction.displayName = "ConfirmAlertDialog.Action";

// ─── Compound export ─────────────────────────────────────────────────────────

export const ConfirmAlertDialog = Object.assign(ConfirmAlertDialogRoot, {
  Content: ConfirmAlertDialogContent,
  Icon: ConfirmAlertDialogIcon,
  Header: ConfirmAlertDialogHeader,
  Title: ConfirmAlertDialogTitle,
  Description: ConfirmAlertDialogDescription,
  Confirmation: ConfirmAlertDialogConfirmation,
  Actions: ConfirmAlertDialogActions,
  Cancel: ConfirmAlertDialogCancel,
  Action: ConfirmAlertDialogAction,
});

export type {
  ConfirmAlertDialogRootProps,
  ConfirmAlertDialogContentProps,
  ConfirmAlertDialogIconProps,
  ConfirmAlertDialogHeaderProps,
  ConfirmAlertDialogConfirmationProps,
  ConfirmAlertDialogActionsProps,
  ConfirmAlertDialogCancelProps,
  ConfirmAlertDialogActionProps,
};
