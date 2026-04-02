"use client";

import { useEffect, useState } from "react";

import { fetchProfile, updateProfile } from "../services";
import type { ProfileSettings } from "../types";

export function useSettingsProfile() {
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const nextProfile = await fetchProfile();
        if (active) {
          setProfile(nextProfile);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load profile.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function save(payload: { name: string; currentPassword?: string; newPassword?: string }) {
    const nextProfile = await updateProfile(payload);
    setProfile(nextProfile);
  }

  return {
    profile,
    isLoading,
    error,
    save,
  };
}
