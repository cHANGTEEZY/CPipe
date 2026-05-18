import { Link, useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
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
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  Settings,
  Users,
  Activity,
  Shield,
  UserCog,
} from "lucide-react";

export function AppSidebar() {
  const location = useLocation();
  const { activeProjectId } = useAppStore();
  const me = useQuery(api.users.getMe);
  const isSuperAdmin = me?.profile?.superAdmin === true;

  if (isSuperAdmin) {
    const adminLinks = [
      { title: "Dashboard", icon: Shield, to: "/admin" },
      { title: "Users", icon: UserCog, to: "/admin/users" },
    ];

    return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="gap-2 px-4 py-4 border-b">
          <Logo className="group-data-[collapsible=icon]:hidden" />
          <div className="flex items-center justify-center size-9 rounded-xl bg-primary shadow-lg shadow-primary/20 hidden group-data-[collapsible=icon]:flex">
            <Shield className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="pt-2">
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminLinks.map((item) => {
                  const isActive =
                    item.to === "/admin"
                      ? location.pathname === "/admin"
                      : location.pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        <Link to={item.to}>
                          <item.icon className="text-primary" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
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
        <SidebarGroup className="pt-2 pb-1">
          <SidebarGroupLabel>Project</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-1">
              <ProjectSwitcher />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

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
      </SidebarContent>
    </Sidebar>
  );
}
