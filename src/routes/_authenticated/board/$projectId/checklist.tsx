import { createFileRoute } from "@tanstack/react-router";
import type { Id } from "@convex/_generated/dataModel";
import ProjectChecklistPage from "@/features/project/checklist";

export const Route = createFileRoute(
  "/_authenticated/board/$projectId/checklist",
)({
  component: ChecklistRoute,
});

function ChecklistRoute() {
  const { projectId } = Route.useParams();
  return <ProjectChecklistPage projectId={projectId as Id<"projects">} />;
}
