import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Id } from "@convex/_generated/dataModel";

interface AppState {
  activeWorkspaceId: Id<"workspaces"> | null;
  activeProjectId: Id<"projects"> | null;
  clipboardOpen: boolean;
  setActiveWorkspace: (id: Id<"workspaces"> | null) => void;
  setActiveProject: (id: Id<"projects"> | null) => void;
  syncSelection: (
    workspaceId: Id<"workspaces"> | null,
    projectId: Id<"projects"> | null,
  ) => void;
  setClipboardOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      activeProjectId: null,
      clipboardOpen: false,
      setActiveWorkspace: (id) =>
        set({ activeWorkspaceId: id, activeProjectId: null }),
      setActiveProject: (id) => set({ activeProjectId: id }),
      syncSelection: (workspaceId, projectId) =>
        set({ activeWorkspaceId: workspaceId, activeProjectId: projectId }),
      setClipboardOpen: (open) => set({ clipboardOpen: open }),
    }),
    {
      name: "cpipe-app-store",
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        activeProjectId: state.activeProjectId,
      }),
    },
  ),
);
