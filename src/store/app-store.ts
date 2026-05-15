import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Id } from "../../convex/_generated/dataModel";

interface AppState {
  activeWorkspaceId: Id<"workspaces"> | null;
  activeProjectId: Id<"projects"> | null;
  setActiveWorkspace: (id: Id<"workspaces"> | null) => void;
  setActiveProject: (id: Id<"projects"> | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      activeProjectId: null,
      setActiveWorkspace: (id) =>
        set({ activeWorkspaceId: id, activeProjectId: null }),
      setActiveProject: (id) => set({ activeProjectId: id }),
    }),
    {
      name: "cpipe-app-store",
    }
  )
);
