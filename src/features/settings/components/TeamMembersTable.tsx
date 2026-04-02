"use client";

import { memo, useCallback, useState } from "react";
import { Badge, Button, Card } from "@/components/atoms";
import { DataTable } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";
import { Modal } from "@/components/layout";
import { Select, TextInput } from "@/components/forms";
import { useTeamMembers } from "../hooks";
import type { TeamMember } from "../types";

interface TeamMemberRowData extends TeamMember, Record<string, unknown> {}

const columns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  {
    key: "role",
    header: "Role",
    render: (row: TeamMemberRowData) => (
      <Badge 
        label={row.role} 
        status={row.role === "admin" ? "completed" : row.role === "manager" ? "sent" : "pending"} 
      />
    ),
  },
];

function getRowId(row: TeamMemberRowData) {
  return row.id;
}

const TeamMemberItem = memo(({ 
  member, 
  onChangeRole, 
  onRemove 
}: { 
  member: TeamMember; 
  onChangeRole: (id: string, role: string) => void;
  onRemove: (id: string) => void;
}) => {
  const handleRoleChange = useCallback((value: string | string[]) => {
    onChangeRole(member.id, String(value));
  }, [member.id, onChangeRole]);

  const handleRemove = useCallback(() => {
    onRemove(member.id);
  }, [member.id, onRemove]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 p-4 rounded-xl border border-border/40 bg-muted/20">
      <div className="flex-1 w-full space-y-1">
        <p className="text-sm font-semibold">{member.name}</p>
        <Select
          className="w-full"
          options={[
            { label: "Viewer", value: "viewer" },
            { label: "Analyst", value: "analyst" },
            { label: "Manager", value: "manager" },
            { label: "Admin", value: "admin" },
          ]}
          value={member.role}
          onChange={handleRoleChange}
        />
      </div>
      <Button 
        variant="destructive" 
        size="sm"
        className="w-full sm:w-auto"
        onClick={handleRemove}
      >
        Remove
      </Button>
    </div>
  );
});

TeamMemberItem.displayName = "TeamMemberItem";

export function TeamMembersTable() {
  const { members, isLoading, error, addMember, changeRole, remove } = useTeamMembers();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");

  const openInvite = useCallback(() => setIsInviteOpen(true), []);
  const closeInvite = useCallback(() => setIsInviteOpen(false), []);

  const handleNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value), []);
  const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value), []);
  const handleRoleChange = useCallback((value: string | string[]) => setRole(String(value)), []);

  const handleInviteWrapper = useCallback(async () => {
    await addMember({ name, email, role });
    setName("");
    setEmail("");
    setRole("viewer");
    setIsInviteOpen(false);
  }, [addMember, name, email, role]);

  const handleChangeRole = useCallback((id: string, nextRole: string) => {
    void changeRole(id, nextRole);
  }, [changeRole]);

  const handleRemoveMember = useCallback((id: string) => {
    void remove(id);
  }, [remove]);

  return (
    <>
      <Card
        description="Review current users and manage role assignments."
        title="Team members"
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-6">
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="px-6 flex justify-between items-center">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Members</h4>
            <Button size="sm" onClick={openInvite}>Invite member</Button>
          </div>

          <DataTable
            className="border-x-0 rounded-none border-b-0"
            columns={columns}
            data={members as TeamMemberRowData[]}
            emptyState={
              <div className="p-12">
                <EmptyState 
                   description="No team members are available. Start by inviting a new member." 
                   title="No team members" 
                />
              </div>
            }
            getRowId={getRowId}
            isLoading={isLoading}
          />
          
          <div className="px-6 pb-6">
            <div className="grid gap-4">
              {members.map((member) => (
                <TeamMemberItem 
                  key={member.id} 
                  member={member} 
                  onChangeRole={handleChangeRole} 
                  onRemove={handleRemoveMember} 
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Modal isOpen={isInviteOpen} title="Invite member" onClose={closeInvite}>
        <div className="flex flex-col gap-6 p-1">
          <div className="grid gap-4">
            <TextInput 
              label="Full Name" 
              placeholder="e.g. Jane Doe"
              value={name} 
              onChange={handleNameChange} 
            />
            <TextInput 
              label="Email Address" 
              placeholder="jane@example.com"
              value={email} 
              onChange={handleEmailChange} 
            />
            <Select
              label="Initial Role"
              options={[
                { label: "Viewer", value: "viewer" },
                { label: "Analyst", value: "analyst" },
                { label: "Manager", value: "manager" },
                { label: "Admin", value: "admin" },
              ]}
              value={role}
              onChange={handleRoleChange}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={closeInvite}>Cancel</Button>
            <Button onClick={handleInviteWrapper}>Send Invitation</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

