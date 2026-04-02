"use client";

import { ArrowUp, Paperclip, PencilLine, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";

import { CHAT_CHARACTER_LIMIT } from "@/features/chat/constants";
import type { SessionChatFile } from "../../services";

export function ChatInputBar({
  chatFiles,
  input,
  isLoading,
  isEditing,
  uploadingFileNames,
  onDeleteFile,
  onFilesSelected,
  onInputChange,
  onSend,
  onStop,
}: Readonly<{
  chatFiles: SessionChatFile[];
  input: string;
  isLoading: boolean;
  isEditing: boolean;
  uploadingFileNames: string[];
  onDeleteFile: (fileId: string) => void;
  onFilesSelected: (files: File[]) => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
  }, []);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if ((!input.trim() && chatFiles.length === 0) || isLoading) {
      return;
    }

    onSend();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, chatFiles.length, isLoading, onSend]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if ((input.trim() || chatFiles.length > 0) && !isLoading) {
        onSend();
      }
    }
  }, [input, chatFiles.length, isLoading, onSend]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onFilesSelected(files);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFilesSelected]);

  const handleTextChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(event.target.value);
    autoResize();
  }, [onInputChange, autoResize]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleStopClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onStop();
  }, [onStop]);

  return (
    <div className="border-t border-border/60 bg-sidebar px-5 py-4">
      {isEditing ? (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
          <PencilLine className="size-3.5" />
          Editing earlier message
        </div>
      ) : null}

      {(chatFiles.length > 0 || uploadingFileNames.length > 0) ? (
        <div className="mb-4 flex flex-wrap gap-2 px-2">
          {chatFiles.map((file) => (
            <div
              key={file.id}
              className="group relative inline-flex items-center gap-2 rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-xs text-foreground transition-all hover:border-primary/30 hover:bg-background"
            >
              <Paperclip className="size-3.5 text-primary/60" />
              <span className="max-w-[180px] truncate font-medium">{file.fileName}</span>
              <button
                type="button"
                onClick={() => onDeleteFile(file.id)}
                className="opacity-0 group-hover:opacity-100 absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition hover:scale-110"
                aria-label={`Remove ${file.fileName}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}

          {uploadingFileNames.map((fileName) => (
            <div
              key={fileName}
              className="inline-flex items-center gap-2 rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-xs text-muted-foreground animate-pulse"
            >
              <Paperclip className="size-3.5" />
              <span className="max-w-[180px] truncate">{fileName}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Uploading</span>
            </div>
          ))}
        </div>
      ) : null}

      <form className="rounded-[28px] border border-border/60 bg-background p-3 shadow-[var(--shadow-composer)]" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          aria-label="Chat message"
          className="min-h-[88px] w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/60"
          maxLength={CHAT_CHARACTER_LIMIT}
          placeholder="Ask anything..."
          rows={1}
          value={input}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
        />

        <div className="mt-3 flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUploadClick}
              className="inline-flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-sidebar text-foreground transition hover:bg-muted"
              aria-label="Upload chat files"
            >
              <Paperclip className="size-4" />
            </button>
            <span className="text-xs text-muted-foreground">
              {isMounted ? input.length : 0}/{CHAT_CHARACTER_LIMIT}
            </span>
          </div>
          {isLoading ? (
            <button
              className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background transition hover:opacity-90 active:scale-95 shadow-sm"
              type="button"
              onClick={handleStopClick}
              aria-label="Stop generation"
            >
              <Square aria-hidden="true" size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              disabled={!input.trim() && chatFiles.length === 0}
              type="submit"
              aria-label="Send message"
            >
              <ArrowUp aria-hidden="true" size={16} />
            </button>
          )}
        </div>
      </form>

      <div className="mt-2 px-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Press Enter to send · Shift + Enter for newline</div>
      <div className="mt-1 px-2 text-xs text-muted-foreground/80">
        Artifact generation is limited to text, code, and sheet outputs.
      </div>
    </div>
  );
}

