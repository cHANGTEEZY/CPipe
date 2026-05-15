import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AppleIcon,
  AuthDivider,
  GoogleIcon,
} from "@/components/auth/auth-split-layout"
import { PasswordField } from "@/components/auth/password-field"
import { login } from "@/lib/auth"
import { useMemo, useState } from "react"

const INPUT_CLASS =
  "h-11 rounded-xl border-border/55 bg-secondary/35 placeholder:text-muted-foreground/75"

export const Route = createFileRoute("/(auth)/login")({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0,
    [email, password],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!login(email, password)) {
      setError("Invalid email or password")
      return
    }
    navigate({ to: "/" })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome!</h1>
        <p className="text-sm text-muted-foreground">
          Log in to Admin Panel to continue to your dashboard.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full rounded-xl gap-2.5 font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        >
          <GoogleIcon />
          Log in with Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full rounded-xl gap-2.5 font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        >
          <AppleIcon />
          Log in with Apple
        </Button>
      </div>

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Link
              to="/reset-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : null}

        <Button
          type="submit"
          variant="secondary"
          disabled={!canSubmit}
          className="h-11 w-full rounded-xl text-base font-medium text-foreground hover:bg-secondary/70 disabled:pointer-events-none disabled:opacity-40"
        >
          Log in
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
