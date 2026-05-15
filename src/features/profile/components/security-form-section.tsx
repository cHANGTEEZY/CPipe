import { Button } from "@/components/animate-ui/components/buttons/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";
import { FieldDescription } from "./field-description";
import { SectionIntro } from "./section-intro";

type SecurityFormSectionProps = {
  idPrefix: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange: (v: string) => void;
  onNewPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export function SecurityFormSection({
  idPrefix,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: SecurityFormSectionProps) {
  const headingId = `${idPrefix}-security-heading`;

  return (
    <section
      className="border-t border-border py-10"
      aria-labelledby={headingId}
    >
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
        <SectionIntro
          headingId={headingId}
          title="Security"
          description="Keep your account safe. Password changes should be wired to your auth service."
        />

        <form
          onSubmit={onSubmit}
          className="space-y-6 lg:col-span-2"
        >
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-current-pw`}>Current password</Label>
            <Input
              id={`${idPrefix}-current-pw`}
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => onCurrentPasswordChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-new-pw`}>New password</Label>
            <Input
              id={`${idPrefix}-new-pw`}
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
            />
            <FieldDescription>
              At least 12 characters in production; match your policy with zod or
              similar on submit.
            </FieldDescription>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-confirm-pw`}>Confirm new password</Label>
            <Input
              id={`${idPrefix}-confirm-pw`}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
            />
          </div>
          <div>
            <Button
              type="submit"
              variant="secondary"
              hoverScale={1}
              tapScale={1}
            >
              Update password
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
