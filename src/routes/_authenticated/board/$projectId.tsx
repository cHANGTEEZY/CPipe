import { createFileRoute } from "@tanstack/react-router";
import type { Id } from "@convex/_generated/dataModel";
import BoardPage from "@/features/board";

export const Route = createFileRoute("/_authenticated/board/$projectId")({
  component: BoardRoute,
});

function BoardRoute() {
  const { projectId } = Route.useParams();
  return <BoardPage projectId={projectId as Id<"projects">} />;
}
