"use client";

import { useState } from "react";
import { Button, Card } from "@/components/atoms";
import { TextInput } from "@/components/forms";
import { useSettingsProfile } from "../hooks";

export function ProfileForm() {
  const { profile, isLoading, error, save } = useSettingsProfile();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const name = draftName ?? profile?.name ?? "";

  async function handleSave() {
    await save({
      name,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    });
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <Card 
      description="Manage your profile information and password." 
      title="My profile"
      padded
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-6">
        {error && <p className="text-sm font-medium text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/10">{error}</p>}
        
        <div className="grid gap-4">
          <TextInput
            label="Name"
            placeholder="Your full name"
            value={name}
            onChange={(event) => setDraftName(event.target.value)}
          />
          <TextInput 
            disabled 
            label="Email" 
            value={profile?.email ?? ""} 
            helperText="Your email address is managed via your account settings."
          />
        </div>

        <div className="h-px bg-border/40 my-2" />

        <div className="grid gap-4">
          <TextInput
            label="Current password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <TextInput
            label="New password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button isLoading={isLoading} className="min-w-32" onClick={() => void handleSave()}>
            Save changes
          </Button>
        </div>
      </div>
    </Card>
  );
}

