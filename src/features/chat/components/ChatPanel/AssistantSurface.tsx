"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useState } from "react";

import { suggestions } from "@/lib/constants";
import { useChatHistory } from "../../hooks/useChatHistory";
import { usePersistentChat } from "../../hooks/usePersistentChat";
import { ArtifactPanel } from "./ArtifactPanel";
import { ChatHeader } from "./ChatHeader";
import { ChatInputBar } from "./ChatInputBar";
import { HistorySidebar } from "./HistorySidebar";
import { MessageThread } from "./MessageThread";
import type { ArtifactState } from "../../hooks/usePersistentChat.helpers";
import type { ArtifactKind } from "../../types/chat.types";
import { createInitialArtifactMetadata } from "../../types/artifact.types";

const SuggestionItem = memo(({
  suggestion,
  onClick
}: {
  suggestion: string;
  onClick: (s: string) => void;
}) => {
  const handleClick = useCallback(() => onClick(suggestion), [suggestion, onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-xl border border-border/40 bg-background/50 p-4 text-left text-sm font-medium text-foreground/80 transition-all hover:border-primary/20 hover:bg-background hover:shadow-lg active:scale-[0.98]"
    >
      {suggestion}
    </button>
  );
});

SuggestionItem.displayName = "SuggestionItem";

export function AssistantSurface({ initialChatId }: Readonly<{ initialChatId?: string }>) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const router = useRouter();
  const history = useChatHistory();
  const chat = usePersistentChat(initialChatId);

  const toggleHistory = useCallback(() => setIsHistoryOpen((current) => !current), []);

  const handleDeleteAll = useCallback(() => {
    void history.deleteAll();
  }, [history]);

  const handleDeleteChat = useCallback((chatId: string) => {
    void history.deleteChat(chatId).then(() => {
      if (initialChatId === chatId) {
        router.push("/assistant");
      }
    });
  }, [history, initialChatId, router]);

  const handleRegenerate = useCallback(() => {
    void chat.regenerate();
  }, [chat]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    chat.setInput(suggestion);
    void chat.sendText(suggestion);
  }, [chat]);

  const handleEditMessage = useCallback((messageId: string, value: string) => {
    void chat.beginEdit(messageId, value);
  }, [chat]);

  const handleDeleteFile = useCallback((fileId: string) => {
    void chat.removeChatFile(fileId);
  }, [chat]);

  const handleFilesSelected = useCallback((files: File[]) => {
    void chat.uploadFiles(files);
  }, [chat]);

  const handleSend = useCallback(() => {
    void chat.sendText(chat.input);
  }, [chat]);

  const handleOpenArtifact = useCallback((id: string, title: string, kind: ArtifactKind, content: string) => {
    chat.setArtifact({
      id,
      title,
      kind,
      content,
      isVisible: true,
      status: "idle",
      metadata: createInitialArtifactMetadata(),
    });
  }, [chat]);

  const handleCloseArtifact = useCallback(() => {
    chat.setArtifact((current: ArtifactState) => ({
      ...current,
      isVisible: false,
    }));
  }, [chat]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background/50">
      <HistorySidebar
        activeChatId={initialChatId ?? null}
        chats={history.chats}
        deletingChatIds={history.deletingChatIds}
        isDeletingAll={history.isDeletingAll}
        isLoading={history.isLoading}
        isOpen={isHistoryOpen}
        onDeleteAll={handleDeleteAll}
        onDeleteChat={handleDeleteChat}
        onNewChat={chat.startNewChat}
        onToggle={toggleHistory}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        <ChatHeader
          title={chat.title}
          isLoading={chat.isLoading}
          hasArtifact={Boolean(chat.latestPersistedArtifact)}
          onNewChat={chat.startNewChat}
          onOpenArtifact={chat.openLatestArtifact}
          onToggle={toggleHistory}
        />

        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          <section className="flex-1 flex flex-col min-w-0 bg-transparent">
            {chat.error ? (
              <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2 transition-all">
                <div className="flex items-center gap-3">
                  <AlertCircle className="size-4 text-destructive" />
                  <span className="text-xs font-semibold text-destructive/80">{chat.error}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="rounded-lg bg-destructive/10 px-3 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/20"
                >
                  Retry
                </button>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto selection:bg-primary/5 scroll-smooth">
              {chat.messages.length === 0 && !chat.isHydrating ? (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="w-full max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-4">
                      <div className="mx-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase tracking-wider font-bold">
                        Assistant
                      </div>
                      <h2 className="text-4xl font-bold tracking-tight text-foreground">
                        How can I <span className="text-primary">help?</span>
                      </h2>
                      <p className="text-base text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
                        Ask a question, analyze a document, or start a new task to get started.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {suggestions.map((suggestion) => (
                        <SuggestionItem
                          key={suggestion}
                          suggestion={suggestion}
                          onClick={handleSuggestionClick}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <MessageThread
                  messages={chat.messages}
                  isLoading={chat.isLoading}
                  onEditMessage={handleEditMessage}
                  onOpenArtifact={handleOpenArtifact}
                />
              )}
            </div>

            <div className="shrink-0 border-t border-border/10">
              <ChatInputBar
                chatFiles={chat.chatFiles}
                input={chat.input}
                isEditing={Boolean(chat.editingMessageId)}
                isLoading={chat.isLoading}
                uploadingFileNames={chat.uploadingFileNames}
                onDeleteFile={handleDeleteFile}
                onFilesSelected={handleFilesSelected}
                onInputChange={chat.setInput}
                onSend={handleSend}
                onStop={chat.stop}
              />
            </div>
          </section>

          <ArtifactPanel
            key={chat.artifact.id}
            artifact={chat.artifact}
            sendMessage={chat.sendMessage}
            versions={chat.artifactVersions}
            onClose={handleCloseArtifact}
            onRestoreVersion={chat.restoreArtifactVersion}
            onSave={chat.saveArtifact}
            onExecuteCode={chat.executeCode}
          />
        </div>
      </main>
    </div>
  );
}




