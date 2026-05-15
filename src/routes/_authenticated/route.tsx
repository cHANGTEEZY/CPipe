import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar";
import ProfileDropDown from "@/components/profile-dropdown";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <span className="text-sm font-medium">Admin Panel</span>
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
