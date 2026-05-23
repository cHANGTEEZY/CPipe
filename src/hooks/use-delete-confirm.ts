import { useCallback, useState, type ReactNode } from "react";

export type DeleteConfirmSeverity = "normal" | "critical";

export type DeleteConfirmRequest = {
  title: string;
  description: ReactNode;
  /** Shown in a highlighted pill — e.g. user or project name */
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: DeleteConfirmSeverity;
  onConfirm: () => void | Promise<void>;
};

type ActiveDeleteConfirm = DeleteConfirmRequest & {
  id: number;
};

export function useDeleteConfirm() {
  const [active, setActive] = useState<ActiveDeleteConfirm | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback((options: DeleteConfirmRequest) => {
    setActive({ ...options, id: Date.now() });
  }, []);

  const dismiss = useCallback(() => {
    if (loading) return;
    setActive(null);
  }, [loading]);

  const confirm = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      await active.onConfirm();
      setActive(null);
    } finally {
      setLoading(false);
    }
  }, [active]);

  return {
    active,
    loading,
    request,
    dismiss,
    confirm,
    open: active !== null,
  };
}
