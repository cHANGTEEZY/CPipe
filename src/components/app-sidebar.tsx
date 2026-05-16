import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/animate-ui/components/radix/sidebar";
import { OrgSwitcher } from "@/components/org-switcher";
import { ProjectSwitcher } from "@/components/project-switcher";
import { useAppStore } from "@/store/app-store";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  User,
  Activity,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProjectId } = useAppStore();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.getMe);
  const isSuperAdmin = me?.profile?.superAdmin === true;

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    window.location.href = "/login";
  }

  const projectLinks = activeProjectId
    ? [
        {
          title: "Board",
          icon: LayoutDashboard,
          to: `/board/${activeProjectId}`,
        },
        {
          title: "Settings",
          icon: Settings,
          to: `/board/${activeProjectId}/settings`,
        },
      ]
    : [];

  const globalLinks = [
    { title: "Members", icon: Users, to: "/settings/members" },
    { title: "Activity", icon: Activity, to: "/activity" },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* ── Header: Brand + Org Switcher ── */}
      <SidebarHeader className="gap-2 px-4 py-4 border-b">
        <Logo className="group-data-[collapsible=icon]:hidden" />
        <div className="flex items-center justify-center size-9 rounded-xl bg-primary shadow-lg shadow-primary/20 hidden group-data-[collapsible=icon]:flex">
          <Activity className="size-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="mt-2">
          <OrgSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* ── Project Switcher ── */}
        <SidebarGroup className="pt-2 pb-1">
          <SidebarGroupLabel>Project</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-1">
              <ProjectSwitcher />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Project-scoped nav ── */}
        {projectLinks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Current project</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projectLinks.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* ── Global nav ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {globalLinks.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── System Administration (super admin only) ── */}
        {isSuperAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="System Admin"
                      isActive={location.pathname.startsWith("/admin")}
                    >
                      <Link to="/admin">
                        <Shield className="text-primary" />
                        <span>System Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* ── Footer: User + Theme + Sign out ── */}
      <SidebarFooter>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {me?.profile?.displayName?.[0]?.toUpperCase() ??
              me?.name?.[0]?.toUpperCase() ??
              "?"}
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium truncate">
              {me?.profile?.displayName ?? me?.name ?? "You"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{me?.email}</p>
          </div>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={handleSignOut}
              className="size-8 p-0"
            >
              <LogOut className="size-4" />
            </SidebarMenuButton>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
