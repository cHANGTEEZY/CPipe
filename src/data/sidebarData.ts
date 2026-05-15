import type { ComponentType, SVGProps } from "react";
import {
  HomeIcon,
  DashboardIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
  ProfileIcon,
} from "@/components/icons";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface SidebarItem {
  title: string;
  icon: IconComponent;
  to: string;
  children?: SidebarItem[];
}

export const sidebarItems: SidebarItem[] = [
  { title: "Home", icon: HomeIcon, to: "/" },
  { title: "Dashboard", icon: DashboardIcon, to: "/dashboard" },
  { title: "Users", icon: UsersIcon, to: "/users" },
  { title: "Profile", icon: ProfileIcon, to: "/profile" },
  { title: "Settings", icon: SettingsIcon, to: "/settings" },
  {
    title: "Admin",
    icon: ShieldIcon,
    to: "/admin",
    children: [{ title: "Users", icon: UsersIcon, to: "/admin/users" }],
  },
];
