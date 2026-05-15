import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router"

import { AuthSplitLayout } from "@/components/auth/auth-split-layout"

export const Route = createFileRoute("/(auth)")({
  component: AuthLayout,
})

function AuthLayout() {
  const { pathname } = useLocation()
  return (
    <AuthSplitLayout pathname={pathname}>
      <Outlet />
    </AuthSplitLayout>
  )
}
