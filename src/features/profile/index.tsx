import type { FormEvent } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { MOCK_USER } from "./demo-data";
import { DangerZoneSection } from "./components/danger-zone-section";
import { NotificationsFormSection } from "./components/notifications-form-section";
import { PersonalFormSection } from "./components/personal-form-section";
import { ProfilePageHeader } from "./components/profile-page-header";
import { ProfileSummary } from "./components/profile-summary";
import { SecurityFormSection } from "./components/security-form-section";

const ProfilePage = () => {
  const idPrefix = useId();

  const [firstName, setFirstName] = useState(MOCK_USER.firstName);
  const [lastName, setLastName] = useState(MOCK_USER.lastName);
  const [email, setEmail] = useState(MOCK_USER.email);
  const [phone, setPhone] = useState(MOCK_USER.phone);
  const [jobTitle, setJobTitle] = useState(MOCK_USER.jobTitle);
  const [timezone, setTimezone] = useState(MOCK_USER.timezone);
  const [bio, setBio] = useState(MOCK_USER.bio);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [weeklyDigestEmail, setWeeklyDigestEmail] = useState(
    MOCK_USER.weeklyDigestEmail,
  );
  const [showOnlineStatus, setShowOnlineStatus] = useState(
    MOCK_USER.showOnlineStatus,
  );

  const onSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Profile saved locally (demo — not sent to an API).");
  };

  const resetPersonalToDemo = () => {
    setFirstName(MOCK_USER.firstName);
    setLastName(MOCK_USER.lastName);
    setEmail(MOCK_USER.email);
    setPhone(MOCK_USER.phone);
    setJobTitle(MOCK_USER.jobTitle);
    setTimezone(MOCK_USER.timezone);
    setBio(MOCK_USER.bio);
    toast.message("Form reset", {
      description: "Restored static demo defaults.",
    });
  };

  const onUpdatePassword = (e: FormEvent) => {
    e.preventDefault();
    toast.message("Password update", {
      description:
        "Hook this button to your auth API. Fields reset for demo safety.",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const onSaveNotifications = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Notification preferences saved (demo).");
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
        demo={{ ...MOCK_USER, jobTitle }}
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
