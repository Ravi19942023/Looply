import { AssistantSurface } from "@features/chat/components/ChatPanel";

export default async function AssistantChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  return <AssistantSurface initialChatId={chatId} />;
}
