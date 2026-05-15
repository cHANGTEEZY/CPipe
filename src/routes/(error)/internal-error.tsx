import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ServerCrash } from 'lucide-react'

export const Route = createFileRoute('/(error)/internal-error')({
  component: InternalErrorPage,
})

function InternalErrorPage() {
  return (
    <div className="text-center space-y-6 max-w-md">
      <div className="bg-destructive/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
        <ServerCrash className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          500 Internal Server Error
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground">
          An unexpected error occurred. Please try again later.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => window.location.reload()}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
