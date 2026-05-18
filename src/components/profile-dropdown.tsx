import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";

const ProfileDropDown = () => {
  const me = useQuery(api.users.getMe);
  const { signOut } = useAuthActions();

  const isSuperAdmin = me?.profile?.superAdmin === true;
  const displayName =
    me?.profile?.displayName ?? me?.name ?? "User";
  const initials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    await signOut();
    toast.success("Signed out");
    window.location.href = "/login";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer outline-none">
        <Avatar>
          <AvatarImage src={me?.profile?.avatarUrl ?? ""} />
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-48 mt-2 rounded-xl" align="end">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {me?.email ?? "My Account"}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/profile">Profile</Link>
          </DropdownMenuItem>
          {!isSuperAdmin && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/settings/members">Settings</Link>
            </DropdownMenuItem>
          )}
          {isSuperAdmin && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/admin/users">User management</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropDown;
