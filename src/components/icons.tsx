import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon as HomeHugeIcon,
  DashboardSquare01Icon as DashboardHugeIcon,
  Shield01Icon as ShieldHugeIcon,
  SettingsIcon as SettingsHugeIcon,
  UserIcon as UserHugeIcon,
  Profile02Icon as ProfileHugeIcon,
} from "@hugeicons/core-free-icons";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function HomeIcon(props: IconProps) {
  return <HugeiconsIcon icon={HomeHugeIcon} {...(props as any)} />;
}

export function DashboardIcon(props: IconProps) {
  return <HugeiconsIcon icon={DashboardHugeIcon} {...(props as any)} />;
}

export function ShieldIcon(props: IconProps) {
  return <HugeiconsIcon icon={ShieldHugeIcon} {...(props as any)} />;
}

export function SettingsIcon(props: IconProps) {
  return <HugeiconsIcon icon={SettingsHugeIcon} {...(props as any)} />;
}

export function UsersIcon(props: IconProps) {
  return <HugeiconsIcon icon={UserHugeIcon} {...(props as any)} />;
}

export function ProfileIcon(props: IconProps) {
  return <HugeiconsIcon icon={ProfileHugeIcon} {...(props as any)} />;
}
