"use client";

import { useEffect, useState } from "react";

import { fetchTeam, inviteMember, removeMember, updateMemberRole } from "../services";
import type { TeamMember } from "../types";

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeam() {
      try {
        const nextMembers = await fetchTeam();
        if (active) {
          setMembers(nextMembers);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load team.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadTeam();

    return () => {
      active = false;
    };
  }, []);

  async function addMember(payload: { name: string; email: string; role: string }) {
    const member = await inviteMember(payload);
    setMembers((current) => [...current, member]);
  }

  async function changeRole(id: string, role: string) {
    const member = await updateMemberRole(id, role);
    setMembers((current) => current.map((item) => (item.id === id ? member : item)));
  }

  async function remove(id: string) {
    await removeMember(id);
    setMembers((current) => current.filter((item) => item.id !== id));
  }

  return {
    members,
    isLoading,
    error,
    addMember,
    changeRole,
    remove,
  };
}
