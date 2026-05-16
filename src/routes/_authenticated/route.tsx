import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar";
import ProfileDropDown from "@/components/profile-dropdown";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.getMe);

  if (isLoading || (isAuthenticated && me === undefined)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super admins bypass the approval gate
  const isSuperAdmin = me?.profile?.superAdmin === true;
  const status = me?.profile?.status;

  // Gate non-superadmin users who aren't approved
  if (!isSuperAdmin && status && status !== "approved") {
    return <Navigate to="/pending" replace />;
  }

  // New users (no profile yet) get pending status — redirect
  // But only if profile has loaded (me is not undefined)
  // (first signup: profile may not be set yet, let them through temporarily
  //  — the register mutation sets status)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <span className="text-sm font-medium">CPipe Tracker</span>
          <div className="ml-auto gap-2 flex items-center justify-center">
            <ThemeToggle />
            <ProfileDropDown />
          </div>
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
