import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const SLOT =
  "size-11 rounded-xl border border-border/55 bg-secondary/35 text-base font-semibold tracking-widest shadow-none first:rounded-xl last:rounded-xl"

export const Route = createFileRoute("/(auth)/otp")({
  component: OtpPage,
})

function OtpPage() {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code we sent so we know it&apos;s you.
        </p>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Verification code
          </p>
          <InputOTP
            containerClassName="justify-center gap-2"
            maxLength={6}
            pattern="^[0-9]+$"
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className={SLOT} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            className="h-11 w-full rounded-xl text-base font-semibold"
          >
            Verify
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
            >
              Resend
            </button>
          </p>

          <p className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
