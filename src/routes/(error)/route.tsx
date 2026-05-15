import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(error)')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Outlet />
    </div>
  )
}
