import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AppleIcon,
  AuthDivider,
  GoogleIcon,
} from "@/components/auth/auth-split-layout"
import { useState } from "react"

const INPUT_CLASS =
  "h-11 rounded-xl border-border/55 bg-secondary/35 placeholder:text-muted-foreground/75"

export const Route = createFileRoute("/(auth)/reset-password")({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const [email, setEmail] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Stub: integrate with backend when available.
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Forgot password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the email tied to your account and we&apos;ll send you a reset
          link.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full rounded-xl gap-2.5 font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full rounded-xl gap-2.5 font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        >
          <AppleIcon />
          Continue with Apple
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

        <Button type="submit" className="h-11 w-full rounded-xl text-base font-semibold">
          Send reset link
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
