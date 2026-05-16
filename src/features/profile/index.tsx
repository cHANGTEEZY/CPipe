import type { FormEvent } from "react";
import { useId, useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { DangerZoneSection } from "./components/danger-zone-section";
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
  const [avatarUrl, setAvatarUrl] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Populate from Convex on load
  useEffect(() => {
    if (!me) return;
    // Prefer profile firstName/lastName, fall back to splitting name
    if (me.profile?.firstName || me.profile?.lastName) {
      setFirstName(me.profile.firstName ?? "");
      setLastName(me.profile.lastName ?? "");
    } else {
      const displayName = me.profile?.displayName ?? me.name ?? "";
      const parts = displayName.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
    }
    setEmail(me.email ?? "");
    setAvatarUrl(me.profile?.avatarUrl ?? "");
  }, [me]);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      await updateProfile({
        firstName,
        lastName,
        displayName,
        avatarUrl: avatarUrl || undefined,
      });
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    }
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

  const displayName = `${firstName} ${lastName}`.trim() || email;

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <ProfilePageHeader />

      <ProfileSummary
        displayName={displayName}
        email={email}
        firstName={firstName}
        lastName={lastName}
        avatar={avatarUrl || me?.profile?.avatarUrl || ""}
        id={me?._id ?? ""}
        role={"user"}
        memberSinceLabel={
          me?._creationTime
            ? new Date(me._creationTime).toLocaleDateString()
            : ""
        }
      />

      <PersonalFormSection
        idPrefix={idPrefix}
        firstName={firstName}
        lastName={lastName}
        email={email}
        avatarUrl={avatarUrl}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onEmailChange={setEmail}
        onAvatarUrlChange={setAvatarUrl}
        onSubmit={onSaveProfile}
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

      <DangerZoneSection idPrefix={idPrefix} />
    </div>
  );
};

export default ProfilePage;
