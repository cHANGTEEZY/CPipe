import {
  createFileRoute,
  Outlet,
  Navigate,
  useLocation,
} from "@tanstack/react-router";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar";
import ProfileDropDown from "@/components/profile-dropdown";
import { WorkspaceProjectSync } from "@/components/workspace-project-sync";
import { WorkspaceInviteBanner } from "@/components/workspace-invite-banner";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const SUPER_ADMIN_PATHS = ["/admin", "/profile", "/bootstrap-admin"];

export const Route = createFileRoute("/_authenticated")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.getMe);
  const ensureProfile = useMutation(api.users.ensureProfile);
  const location = useLocation();
  const pathname = location.pathname;

  const isSuperAdmin = me?.profile?.superAdmin === true;
  const status = me?.profile?.status;

  useEffect(() => {
    if (!isAuthenticated || me === undefined || me === null) return;
    if (!me.profile && !isSuperAdmin) {
      void ensureProfile();
    }
  }, [isAuthenticated, me, isSuperAdmin, ensureProfile]);

  if (isLoading || (isAuthenticated && me === undefined)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect =
      pathname + (location.searchStr ?? "");
    return (
      <Navigate
        to="/login"
        search={{ redirect: redirect || undefined }}
        replace
      />
    );
  }

  const isSuperAdminRoute = SUPER_ADMIN_PATHS.some((p) =>
    pathname.startsWith(p),
  );

  if (isSuperAdmin) {
    if (!isSuperAdminRoute) {
      return <Navigate to="/admin/users" replace />;
    }
  } else {
    if (pathname.startsWith("/admin")) {
      return <Navigate to="/" replace />;
    }
    if (
      status === "rejected" ||
      status === "suspended" ||
      status === "banned"
    ) {
      return <Navigate to="/pending" replace />;
    }
  }

  return (
    <SidebarProvider>
      {!isSuperAdmin && <WorkspaceProjectSync />}
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight bg-primary text-primary-foreground px-2 py-0.5 rounded">
              CP
            </span>
            <span className="text-sm font-semibold tracking-tight">
              CPipeLine
            </span>
          </div>
          <div className="ml-auto gap-2 flex items-center justify-center">
            <ThemeToggle />
            <ProfileDropDown />
          </div>
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-6">
          {!isSuperAdmin && <WorkspaceInviteBanner />}
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
