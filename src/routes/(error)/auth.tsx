import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export const Route = createFileRoute('/(error)/auth')({
  component: AuthPage,
})

function AuthPage() {
  return (
    <div className="text-center space-y-6 max-w-md">
      <div className="bg-destructive/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          401 Unauthorized
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Authentication required</h1>
        <p className="text-muted-foreground">
          You need to sign in to access this page. Please log in and try again.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button asChild>
          <Link to="/auth">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
