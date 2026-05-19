import { createFileRoute } from "@tanstack/react-router";
import AcceptInvitePage from "@/features/accept-invite";

type AcceptInviteSearch = {
  token?: string;
};

export const Route = createFileRoute("/_authenticated/accept-invite")({
  validateSearch: (search: Record<string, unknown>): AcceptInviteSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: AcceptInviteRoute,
});

function AcceptInviteRoute() {
  const { token } = Route.useSearch();
  return <AcceptInvitePage token={token} />;
}
