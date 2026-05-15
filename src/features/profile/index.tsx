import type { FormEvent } from "react";
import { useId, useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { DangerZoneSection } from "./components/danger-zone-section";
import { NotificationsFormSection } from "./components/notifications-form-section";
import { PersonalFormSection } from "./components/personal-form-section";
import { ProfilePageHeader } from "./components/profile-page-header";
import { ProfileSummary } from "./components/profile-summary";
import { SecurityFormSection } from "./components/security-form-section";

const ProfilePage = () => {
  const idPrefix = useId();
  const me = useQuery(api.users.getMe);
  const updateProfile = useMutation(api.users.updateProfile);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [bio, setBio] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [weeklyDigestEmail, setWeeklyDigestEmail] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // Populate from Convex on load
  useEffect(() => {
    if (!me) return;
    const displayName = me.profile?.displayName ?? me.name ?? "";
    const parts = displayName.split(" ");
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" ") ?? "");
    setEmail(me.email ?? "");
  }, [me]);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        displayName: `${firstName} ${lastName}`.trim(),
      });
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    }
  };

  const resetPersonalToDemo = () => {
    if (!me) return;
    const displayName = me.profile?.displayName ?? me.name ?? "";
    const parts = displayName.split(" ");
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" ") ?? "");
    setEmail(me.email ?? "");
    toast.message("Form reset");
  };

  const onUpdatePassword = (e: FormEvent) => {
    e.preventDefault();
    toast.message("Password update", {
      description: "Connect to your auth provider to change passwords.",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const onSaveNotifications = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Notification preferences saved");
  };

  const displayName = `${firstName} ${lastName}`.trim() || email;

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <ProfilePageHeader />

      <ProfileSummary
        displayName={displayName}
        email={email}
        firstName={firstName}
        lastName={lastName}
        demo={{ firstName, lastName, email, phone, jobTitle, timezone, bio,
          weeklyDigestEmail, showOnlineStatus,
          avatar: me?.profile?.avatarUrl ?? "",
          location: "", } as any}
      />

      <PersonalFormSection
        idPrefix={idPrefix}
        firstName={firstName}
        lastName={lastName}
        email={email}
        phone={phone}
        jobTitle={jobTitle}
        timezone={timezone}
        bio={bio}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onEmailChange={setEmail}
        onPhoneChange={setPhone}
        onJobTitleChange={setJobTitle}
        onTimezoneChange={setTimezone}
        onBioChange={setBio}
        onSubmit={onSaveProfile}
        onResetDemo={resetPersonalToDemo}
      />

      <SecurityFormSection
        idPrefix={idPrefix}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={onUpdatePassword}
      />

      <NotificationsFormSection
        idPrefix={idPrefix}
        weeklyDigestEmail={weeklyDigestEmail}
        showOnlineStatus={showOnlineStatus}
        onWeeklyDigestChange={setWeeklyDigestEmail}
        onShowOnlineChange={setShowOnlineStatus}
        onSubmit={onSaveNotifications}
      />

      <DangerZoneSection idPrefix={idPrefix} />
    </div>
  );
};

export default ProfilePage;
