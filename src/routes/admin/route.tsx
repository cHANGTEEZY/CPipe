import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Link, useLocation } from "@tanstack/react-router";
import { Loader2, Shield, Users, User, LayoutDashboard, LogOut, ChevronRight } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const me = useQuery(api.users.getMe);
  const { signOut } = useAuthActions();
  const location = useLocation();

  if (me === undefined) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me || me.profile?.superAdmin !== true) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, to: "/admin" },
    { title: "Users", icon: Users, to: "/admin/users" },
    { title: "Profile", icon: User, to: "/admin/profile" },
  ];

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    window.location.href = "/login";
  }

  const displayName = me.profile?.displayName ?? me.name ?? "Admin";
  const email = me.email ?? "";
  const avatarUrl = me.profile?.avatarUrl ?? "";
  const initials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r bg-card">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-14 border-b">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">CPipe Admin</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Super Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.title}
                {isActive && <ChevronRight className="size-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Back to app */}
        <div className="px-3 py-2 border-t">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="size-3.5 rotate-180" />
            Back to App
          </Link>
        </div>

        {/* User footer */}
        <div className="px-4 py-3 border-t flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{email}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
