import { Button } from "@/components/animate-ui/components/buttons/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FormEvent } from "react";
import { FieldDescription } from "./field-description";
import { SectionIntro } from "./section-intro";

const textareaClass = cn(
  "flex min-h-[120px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground ring-offset-background md:text-sm",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

type PersonalFormSectionProps = {
  idPrefix: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  timezone: string;
  bio: string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onJobTitleChange: (v: string) => void;
  onTimezoneChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onResetDemo: () => void;
};

export function PersonalFormSection({
  idPrefix,
  firstName,
  lastName,
  email,
  phone,
  jobTitle,
  timezone,
  bio,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
  onJobTitleChange,
  onTimezoneChange,
  onBioChange,
  onSubmit,
  onResetDemo,
}: PersonalFormSectionProps) {
  const headingId = `${idPrefix}-personal-heading`;

  return (
    <section
      className="border-t border-border py-10 mt-10"
      aria-labelledby={headingId}
    >
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
        <SectionIntro
          headingId={headingId}
          title="Personal information"
          description="Your name and contact details shown on invitations, audit logs, and directory listings."
        />

        <form onSubmit={onSubmit} className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-first`}>First name</Label>
              <Input
                id={`${idPrefix}-first`}
                name="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-last`}>Last name</Label>
              <Input
                id={`${idPrefix}-last`}
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-email`}>Email</Label>
            <Input
              id={`${idPrefix}-email`}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
            <FieldDescription>
              Used for sign-in and billing receipts. Changing it may require
              verification on a real deployment.
            </FieldDescription>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
              <Input
                id={`${idPrefix}-phone`}
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-title`}>Job title</Label>
              <Input
                id={`${idPrefix}-title`}
                name="jobTitle"
                autoComplete="organization-title"
                value={jobTitle}
                onChange={(e) => onJobTitleChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-timezone`}>Time zone</Label>
            <Input
              id={`${idPrefix}-timezone`}
              name="timezone"
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              placeholder="e.g. Europe/London"
            />
            <FieldDescription>
              Report exports and scheduled digests use this zone for timestamps.
            </FieldDescription>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-bio`}>Bio</Label>
            <textarea
              id={`${idPrefix}-bio`}
              name="bio"
              rows={4}
              className={textareaClass}
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="A short bio visible to teammates…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" hoverScale={1} tapScale={1} variant="default">
              Save changes
            </Button>
            <Button
              type="button"
              variant="outline"
              hoverScale={1}
              tapScale={1}
              onClick={onResetDemo}
            >
              Reset to demo defaults
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
