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
import { useMemo, useState } from "react"

const INPUT_CLASS =
  "h-11 rounded-xl border-border/55 bg-secondary/35 placeholder:text-muted-foreground/75"

export const Route = createFileRoute("/(auth)/register")({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  const canSubmit = useMemo(
    () =>
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 8 &&
      password === confirm,
    [name, email, password, confirm],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password !== confirm) {
      setError("Passwords must match.")
      return
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.")
      return
    }
    navigate({ to: "/login" })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
        <p className="text-sm text-muted-foreground">
          Create your Admin Panel account to get started.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full rounded-xl gap-2.5 font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        >
          <GoogleIcon />
          Sign up with Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full rounded-xl gap-2.5 font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        >
          <AppleIcon />
          Sign up with Apple
        </Button>
      </div>

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full name
          </Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

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
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <PasswordField
            id="password"
            autoComplete="new-password"
            placeholder="Create a password (8+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-sm font-medium">
            Confirm password
          </Label>
          <PasswordField
            id="confirm"
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          Create account
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
