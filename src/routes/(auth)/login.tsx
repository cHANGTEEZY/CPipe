import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthDivider, GoogleIcon } from "@/components/auth/auth-split-layout";
import { PasswordField } from "@/components/auth/password-field";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

const INPUT_CLASS =
  "h-11 rounded-xl border-border/55 bg-secondary/35 placeholder:text-muted-foreground/75";

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/(auth)/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { signIn } = useAuthActions();

  function afterLoginPath() {
    return redirect && redirect.startsWith("/") ? redirect : "/";
  }
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      navigate({ href: afterLoginPath() });
    } catch (err: any) {
      toast.error(err.message ?? "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signIn("google", { redirectTo: afterLoginPath() });
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back!</h1>
        <p className="text-sm text-muted-foreground">
          Log in to CPipeLine to continue.
        </p>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl gap-2.5 text-sm font-medium border-border/60"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </Button>

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

        <Button
          type="submit"
          disabled={loading || !email || !password}
          className="h-11 w-full rounded-xl text-base font-medium disabled:opacity-40"
        >
          {loading ? "Signing in…" : "Log in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
