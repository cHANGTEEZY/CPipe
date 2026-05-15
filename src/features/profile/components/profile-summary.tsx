import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Camera, Fingerprint } from "lucide-react";
import type { ProfileDemo } from "../demo-data";
import { initials } from "../utils/initials";

type ProfileSummaryProps = {
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  demo: Pick<
    ProfileDemo,
    "avatar" | "id" | "role" | "memberSinceLabel" | "jobTitle"
  >;
};

const roleLabel = (role: string) =>
  role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function ProfileSummary({
  displayName,
  email,
  firstName,
  lastName,
  demo,
}: ProfileSummaryProps) {
  return (
    <div className="relative mb-2  overflow-hidden rounded-2xl shadow-sm">
      <HexagonBackground
        hexagonSize={50}
        hexagonMargin={2}
        className="absolute inset-0 z-0 min-h-full rounded-2xl"
      />

      <div className="relative z-10 pointer-events-none px-6 pb-6 pt-16 sm:pt-20">
        <div className="group relative -mt-10 mb-4 inline-block pointer-events-auto sm:-mt-12">
          <Avatar className="size-20 border-4 border-card shadow-md sm:size-24">
            <AvatarImage src={demo.avatar} alt="" />
            <AvatarFallback className="bg-muted text-lg font-semibold text-muted-foreground">
              {initials(firstName, lastName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Change avatar"
          >
            <Camera className="size-5 text-white" />
          </button>
        </div>

        <div className="pointer-events-none **:pointer-events-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight">
                {displayName}
              </h2>
              {demo.jobTitle && (
                <p className="text-sm font-medium text-muted-foreground">
                  {demo.jobTitle}
                </p>
              )}
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>

            <Badge
              variant="secondary"
              className="w-fit capitalize border-0 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
            >
              {roleLabel(demo.role)}
            </Badge>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Fingerprint className="size-3.5 opacity-60" />
              ID&nbsp;
              <span className="font-mono font-medium text-foreground">
                {demo.id}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 opacity-60" />
              Member since&nbsp;
              <span className="font-medium text-foreground">
                {demo.memberSinceLabel}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
