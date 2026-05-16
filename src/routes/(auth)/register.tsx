import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthDivider, GoogleIcon } from "@/components/auth/auth-split-layout"
import { PasswordField } from "@/components/auth/password-field"
import { useAuthActions } from "@convex-dev/auth/react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { useState } from "react"
import { toast } from "sonner"

const INPUT_CLASS =
  "h-11 rounded-xl border-border/55 bg-secondary/35 placeholder:text-muted-foreground/75"

export const Route = createFileRoute("/(auth)/register")({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { signIn } = useAuthActions()
  const initPending = useMutation(api.users.initNewUser)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const fullName = `${firstName} ${lastName}`.trim()
  const canSubmit =
    firstName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error("Passwords must match.")
      return
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters.")
      return
    }
    setLoading(true)
    try {
      await signIn("password", { email, password, name: fullName, flow: "signUp" })
      // Set user profile to pending after signup
      await initPending({ firstName, lastName })
      toast.success("Account created! Awaiting admin approval.")
      navigate({ to: "/pending" })
    } catch (err: any) {
      toast.error(err.message ?? "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      await signIn("google", { redirectTo: "/" })
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up and wait for admin approval to access CPipe Tracker.
        </p>
      </div>

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl gap-2.5 text-sm font-medium border-border/60"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Sign up with Google"}
      </Button>

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* First + Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First name
            </Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last name
            </Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
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

        <Button
          type="submit"
          disabled={!canSubmit || loading}
          className="h-11 w-full rounded-xl text-base font-medium disabled:opacity-40"
        >
          {loading ? "Creating account…" : "Create account"}
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
