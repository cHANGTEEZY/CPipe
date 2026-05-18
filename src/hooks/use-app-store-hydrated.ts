import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";

/** True once workspace/project IDs are restored from localStorage. */
export function useAppStoreHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useAppStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    setHydrated(useAppStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hydrated;
}
