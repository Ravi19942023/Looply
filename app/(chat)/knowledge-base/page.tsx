import { auth } from "@/app/(auth)/auth";
import { KnowledgeBaseManager } from "@/components/workspace/knowledge-base-manager";
import { canManageKnowledgeBase } from "@/lib/auth/permissions";

export default async function Page() {
  const session = await auth();

  return (
    <KnowledgeBaseManager
      canManage={
        session?.user ? canManageKnowledgeBase(session.user.role) : false
      }
    />
  );
}
