"use client";

import { Copy, PencilLine, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { FileAttachment } from "./FileAttachment";
import { MessagePart } from "./MessagePart";
import type { UIMessage } from "ai";
import {
  type Annotation,
  type Attachment,
  type ChatMessage,
  type ArtifactKind,
} from "../../types/chat.types";
import { getMessageText } from "../../utils/chat.utils";

export interface MessageThreadProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onEditMessage: (messageId: string, value: string) => void;
  onOpenArtifact?: (id: string, title: string, kind: ArtifactKind, content: string) => void;
}

export function MessageThread({
  messages,
  isLoading,
  onEditMessage,
  onOpenArtifact,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleCopy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
  }, []);

  const handleEdit = useCallback((messageId: string, text: string) => {
    onEditMessage(messageId, text);
  }, [onEditMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="space-y-5 px-5 py-5">
      {messages.map((message) => {
        const isAssistant = message.role === "assistant";
        type Part = UIMessage["parts"][number];
        const lastPartIndex = message.parts.length - 1;
        const messageText = getMessageText(message);

        return (
          <div key={message.id} className={`group flex ${isAssistant ? "justify-start" : "justify-end"} animate-slide-up`}>
            <div
              className={cn(
                "max-w-[min(80ch,100%)] px-4 py-3 shadow-sm transition-all duration-300",
                isAssistant
                  ? "rounded-[24px] rounded-tl-sm border border-border/60 bg-card/50 backdrop-blur-sm text-foreground"
                  : "rounded-[24px] rounded-br-sm border border-border/30 bg-gradient-to-br from-primary/90 to-primary text-primary-foreground"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                  {isAssistant ? <Sparkles className="size-3 text-primary animate-pulse" /> : null}
                  <span>{isAssistant ? "Assistant" : "You"}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  {message.role === "user" && messageText ? (
                    <button
                      type="button"
                      onClick={() => handleEdit(message.id, messageText)}
                      className="inline-flex size-6 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Edit message"
                    >
                      <PencilLine className="size-3" />
                    </button>
                  ) : null}
                  {messageText ? (
                    <button
                      type="button"
                      onClick={() => handleCopy(messageText)}
                      className="inline-flex size-6 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Copy message"
                    >
                      <Copy className="size-3" />
                    </button>
                  ) : null}
                </div>
              </div>

              {message.parts.map((part: Part, index: number) => (
                <MessagePart
                  key={`${message.id}-part-${index}`}
                  part={part}
                  index={index}
                  isAssistant={isAssistant}
                  isLastPart={isAssistant && index === lastPartIndex}
                  isLoading={isLoading}
                  annotations={message.annotations}
                  onOpenArtifact={onOpenArtifact}
                />
              ))}

              {message.attachments && message.attachments.length > 0 ? (
                <div className={`mt-3 flex flex-wrap gap-2 ${isAssistant ? "justify-start" : "justify-end"}`}>
                  {message.attachments.map((attachment: Attachment, idx: number) => (
                    <FileAttachment
                      key={`${message.id}-att-${idx}`}
                      name={attachment.name || "File"}
                      url={attachment.url || "#"}
                    />
                  ))}
                </div>
              ) : null}

              {message.annotations?.map((annotation: Annotation, idx: number) => {
                if (annotation?.type === "token-usage") {
                  const usage = annotation as any; // Cast locally for usage as TokenUsageAnnotation is implicit
                  return (
                    <div
                      key={`usage-${idx}`}
                      className="mt-4 flex items-center justify-end gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest"
                      title={`Prompt: ${usage.promptTokens} | Completion: ${usage.completionTokens}`}
                    >
                      <Sparkles className="size-3" />
                      <span>{usage.totalTokens} Tokens</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      })}

      {isLoading && messages.at(-1)?.role === "user" ? (
        <div className="flex justify-start animate-slide-up">
          <div className="max-w-[min(80ch,100%)] rounded-[24px] rounded-tl-sm border border-border/60 bg-card/30 backdrop-blur-sm px-4 py-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              <Sparkles className="size-3 animate-spin [animation-duration:3s]" />
              <span>Assistant</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5 items-center">
                <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-primary animate-bounce" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary/70 shimmer">Processing Request...</span>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
