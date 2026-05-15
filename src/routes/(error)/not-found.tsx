import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export const Route = createFileRoute('/(error)/not-found')({
  component: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="text-center space-y-6 max-w-md">
      <div className="bg-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          404 Not Found
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
