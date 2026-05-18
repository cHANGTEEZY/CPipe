import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAppStore } from "@/store/app-store";
import { useAppStoreHydrated } from "@/hooks/use-app-store-hydrated";

const BOARD_PATH = /^\/board\/([^/]+)/;

/**
 * Keeps workspace/project store aligned with the URL on refresh and
 * avoids navigation side effects until persisted state has rehydrated.
 */
export function WorkspaceProjectSync() {
  const hydrated = useAppStoreHydrated();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const boardMatch = pathname.match(BOARD_PATH);
  const projectIdFromUrl = boardMatch?.[1] as Id<"projects"> | undefined;

  const { activeWorkspaceId, activeProjectId, syncSelection, setActiveProject } =
    useAppStore();

  const projectFromUrl = useQuery(
    api.projects.get,
    projectIdFromUrl ? { projectId: projectIdFromUrl } : "skip",
  );

  const projects = useQuery(
    api.projects.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip",
  );

  // Board URL is source of truth on load / refresh
  useEffect(() => {
    if (!hydrated || !projectIdFromUrl) return;
    if (projectFromUrl === undefined) return;
    if (!projectFromUrl) return;

    if (
      activeWorkspaceId !== projectFromUrl.workspaceId ||
      activeProjectId !== projectFromUrl._id
    ) {
      syncSelection(projectFromUrl.workspaceId, projectFromUrl._id);
    }
  }, [
    hydrated,
    projectIdFromUrl,
    projectFromUrl,
    activeWorkspaceId,
    activeProjectId,
    syncSelection,
  ]);

  // Non-board routes: drop project if it no longer exists in the workspace
  useEffect(() => {
    if (!hydrated || projectIdFromUrl) return;
    if (!activeWorkspaceId || !activeProjectId) return;
    if (projects === undefined) return;

    const stillExists = projects.some((p) => p._id === activeProjectId);
    if (!stillExists) {
      setActiveProject(null);
    }
  }, [
    hydrated,
    projectIdFromUrl,
    activeWorkspaceId,
    activeProjectId,
    projects,
    setActiveProject,
  ]);

  return null;
}
