import { Bell } from "lucide-react";

import { FeatureShell } from "@/features/shared/FeatureShell";

export function NotificationsPage() {
  return (
    <FeatureShell
      description="Notification list, unread states, and mark-as-read flows will land here."
      emptyDescription="Notifications depend on a persistence contract that is still deferred in the execution baseline."
      emptyTitle="Notifications pending"
      eyebrow="Notifications"
      icon={<Bell aria-hidden="true" size={32} />}
      title="Notifications"
    />
  );
}
