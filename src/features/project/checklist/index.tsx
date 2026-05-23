import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { CheckSquare, User, Users } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistPanel } from "./components/checklist-panel";

type ProjectChecklistPageProps = {
  projectId: Id<"projects">;
};

function ProjectChecklistPage({ projectId }: ProjectChecklistPageProps) {
  const [tab, setTab] = useState<"project" | "personal">("project");

  const project = useQuery(api.projects.get, { projectId });
  const myMembership = useQuery(
    api.members.getMyMembership,
    project?.workspaceId ? { workspaceId: project.workspaceId } : "skip",
  );

  const canEditTeam =
    myMembership?.role === "owner" ||
    myMembership?.role === "admin" ||
    myMembership?.role === "editor";

  if (project === undefined) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Loading…
      </p>
    );
  }

  if (project === null) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Project not found.
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CheckSquare className="size-6" />
          Checklist
        </h1>
        <p className="text-sm text-muted-foreground">
          {project.name} — track tasks separately from the kanban board. Pin
          items or send them to your clipboard.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "project" | "personal")}
      >
        <TabsList>
          <TabsTrigger value="project" className="gap-2">
            <Users className="size-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="personal" className="gap-2">
            <User className="size-4" />
            Mine
          </TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="mt-4">
          <ChecklistPanel
            projectId={projectId}
            scope="project"
            canEdit={!!canEditTeam}
          />
        </TabsContent>

        <TabsContent value="personal" className="mt-4">
          <ChecklistPanel
            projectId={projectId}
            scope="personal"
            canEdit
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjectChecklistPage;
