import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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
