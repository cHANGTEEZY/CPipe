import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Button } from "@/components/ui/button";
import { FileQuestion, ServerCrash } from "lucide-react";

function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
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
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="bg-destructive/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
          <ServerCrash className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            500 Internal Server Error
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  errorComponent: ErrorFallback,
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  ),
});
