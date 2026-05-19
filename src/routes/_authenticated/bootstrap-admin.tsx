import { createFileRoute } from "@tanstack/react-router";
import BootstrapAdminPage from "@/features/admin/bootstrap-admin";

export const Route = createFileRoute("/_authenticated/bootstrap-admin")({
  component: BootstrapAdminPage,
});
