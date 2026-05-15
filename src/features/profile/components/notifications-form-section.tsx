import { Button } from "@/components/animate-ui/components/buttons/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";
import { FieldDescription } from "./field-description";
import { SectionIntro } from "./section-intro";

type NotificationsFormSectionProps = {
  idPrefix: string;
  weeklyDigestEmail: boolean;
  showOnlineStatus: boolean;
  onWeeklyDigestChange: (checked: boolean) => void;
  onShowOnlineChange: (checked: boolean) => void;
  onSubmit: (e: FormEvent) => void;
};

export function NotificationsFormSection({
  idPrefix,
  weeklyDigestEmail,
  showOnlineStatus,
  onWeeklyDigestChange,
  onShowOnlineChange,
  onSubmit,
}: NotificationsFormSectionProps) {
  const headingId = `${idPrefix}-notifications-heading`;

  return (
    <section
      className="border-t border-border py-10"
      aria-labelledby={headingId}
    >
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
        <SectionIntro
          headingId={headingId}
          title="Notifications"
          description="Control digests and presence. Values are held in component state for now."
        />

        <form onSubmit={onSubmit} className="space-y-6 lg:col-span-2">
          <div className="flex gap-3">
            <Checkbox
              id={`${idPrefix}-digest`}
              checked={weeklyDigestEmail}
              onCheckedChange={(v) => onWeeklyDigestChange(v === true)}
            />
            <div className="space-y-0 leading-none">
              <Label
                htmlFor={`${idPrefix}-digest`}
                className="cursor-pointer font-normal leading-snug"
              >
                Weekly email digest
              </Label>
              <FieldDescription>
                Summary of activity across teams you belong to.
              </FieldDescription>
            </div>
          </div>

          <div className="flex gap-3">
            <Checkbox
              id={`${idPrefix}-online`}
              checked={showOnlineStatus}
              onCheckedChange={(v) => onShowOnlineChange(v === true)}
            />
            <div className="space-y-0 leading-none">
              <Label
                htmlFor={`${idPrefix}-online`}
                className="cursor-pointer font-normal leading-snug"
              >
                Show me as online when active
              </Label>
              <FieldDescription>
                Others can see a green presence indicator in chat and mentions.
              </FieldDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="default"
              hoverScale={1}
              tapScale={1}
            >
              Save notification preferences
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
