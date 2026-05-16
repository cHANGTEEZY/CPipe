import { Button } from "@/components/animate-ui/components/buttons/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";
import { FieldDescription } from "./field-description";
import { SectionIntro } from "./section-intro";

type PersonalFormSectionProps = {
  idPrefix: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onAvatarUrlChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export function PersonalFormSection({
  idPrefix,
  firstName,
  lastName,
  email,
  avatarUrl,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onAvatarUrlChange,
  onSubmit,
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
          description="Your name, contact details and profile picture."
        />

        <form onSubmit={onSubmit} className="space-y-6 lg:col-span-2">
          {/* First + Last Name */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-first`}>First name</Label>
              <Input
                id={`${idPrefix}-first`}
                name="firstName"
                autoComplete="given-name"
                placeholder="First name"
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
                placeholder="Last name"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-email`}>Email</Label>
            <Input
              id={`${idPrefix}-email`}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              readOnly
              className="opacity-60 cursor-not-allowed"
            />
            <FieldDescription>
              Email is managed by your auth provider and cannot be changed here.
            </FieldDescription>
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-avatar`}>Profile picture URL</Label>
            <Input
              id={`${idPrefix}-avatar`}
              name="avatarUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={avatarUrl}
              onChange={(e) => onAvatarUrlChange(e.target.value)}
            />
            <FieldDescription>
              Paste a public image URL. Leave blank to use your initials as avatar.
            </FieldDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" hoverScale={1} tapScale={1} variant="default">
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
