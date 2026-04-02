/* eslint-disable max-lines */
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";

import { ChatbotError } from "@/lib/errors";
import type { Document, Suggestion } from "@/lib/db/schema";
import type { ArtifactKind, ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { applyArtifactStreamPart } from "../components/ChatPanel/artifact-registry";
import { deleteChatFile, fetchChatFiles, uploadChatFile, type SessionChatFile } from "../services";
import { DRAFT_STORAGE_KEY, extractChatId, INITIAL_ARTIFACT, type ArtifactState } from "./usePersistentChat.helpers";
import {
  createInitialArtifactMetadata,
  type ArtifactExecutionOutput,
} from "../types/artifact.types";

export function usePersistentChat(initialChatId?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { mutate } = useSWRConfig();

  const routeChatId = initialChatId ?? extractChatId(pathname);
  const [draftChatId, setDraftChatId] = useState("");
  const chatId = routeChatId ?? (draftChatId || "temp-id");

  useEffect(() => {
    if (!routeChatId && !draftChatId) {
      setDraftChatId(generateUUID());
    }
  }, [routeChatId, draftChatId]);


  const [input, setInputState] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      setInputState(saved);
    }
  }, []);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<ArtifactState>(INITIAL_ARTIFACT);
  const [uploadingFileNames, setUploadingFileNames] = useState<string[]>([]);
  const [stagedFileIds, setStagedFileIds] = useState<Set<string>>(new Set());

  const resetArtifactMetadata = useCallback(() => createInitialArtifactMetadata(), []);

  const { data: persistedChat, isLoading: isHydrating } = useSWR<{ messages: ChatMessage[]; title: string }>(
    routeChatId ? `/api/v1/messages?chatId=${chatId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const initialMessages = persistedChat?.messages ?? [];
  const loadedChatIds = useRef(new Set<string>());

  const { data: latestArtifactBundle } = useSWR<{
    artifact: { id: string; title: string; kind: ArtifactKind } | null;
    versions: Document[];
  }>(routeChatId ? `/api/v1/document?chatId=${chatId}` : null, fetcher, {
    revalidateOnFocus: false,
  });
  const chatFilesKey = `/api/v1/chat-files?chatId=${chatId}`;
  const { data: chatFiles } = useSWR<SessionChatFile[]>(chatFilesKey, () => fetchChatFiles(chatId), {
    revalidateOnFocus: false,
  });

  const chat = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/v1/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          id: chatId,
          messages,
        },
      }),
    }),
    onData: (dataPart) => {
      const part = dataPart as { type?: string; data?: unknown };

      switch (part.type) {
        case "data-id":
          setArtifact((current: ArtifactState) => ({
            ...current,
            id: String(part.data),
            isVisible: true,
            status: "streaming",
            metadata:
              current.id === String(part.data) ? current.metadata : resetArtifactMetadata(),
          }));
          break;
        case "data-title":
          setArtifact((current: ArtifactState) => ({
            ...current,
            title: String(part.data),
            isVisible: true,
            status: "streaming",
          }));
          break;
        case "data-kind":
          setArtifact((current: ArtifactState) => ({
            ...current,
            kind: part.data as ArtifactKind,
            isVisible: true,
            status: "streaming",
          }));
          break;
        case "data-clear":
          setArtifact((current: ArtifactState) => ({
            ...current,
            content: "",
            isVisible: true,
            status: "streaming",
            metadata: {
              ...current.metadata,
              suggestions: [],
            },
          }));
          break;
        case "data-textDelta":
        case "data-codeDelta":
        case "data-sheetDelta":
          applyArtifactStreamPart({
            setArtifact,
            streamPart: part,
          });
          break;
        case "data-suggestion":
          setArtifact((current: ArtifactState) => ({
            ...current,
            metadata: {
              ...current.metadata,
              suggestions: [...current.metadata.suggestions, part.data as Suggestion],
            },
          }));
          break;
        case "data-finish":
          setArtifact((current: ArtifactState) => ({
            ...current,
            status: "idle",
          }));
          break;
        default:
          break;
      }
    },
    onFinish: () => {
      if (!routeChatId) {
        router.replace(`/assistant/${chatId}`);
      }
      void mutate("/api/v1/history?limit=50");
      void mutate(`/api/v1/document?chatId=${chatId}`);
      void mutate(chatFilesKey);
    },
    onError: (error) => {
      if (error instanceof ChatbotError) {
        toast.error(error.message);
        return;
      }

      toast.error(error.message || "Failed to send message.");
    },
  });

  useEffect(() => {
    if (!persistedChat?.messages || loadedChatIds.current.has(chatId)) {
      return;
    }

    if (chat.messages.length > 0 && persistedChat.messages.length <= chat.messages.length) {
       loadedChatIds.current.add(chatId);
       return;
    }

    loadedChatIds.current.add(chatId);
    chat.setMessages(persistedChat.messages);
  }, [chat, chatId, persistedChat?.messages]);

  const isLoading = chat.status === "submitted" || chat.status === "streaming";

  const setInput = (value: string) => {
    setInputState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, value);
    }
  };

  const sendText = async (value: string) => {
    const trimmed = value.trim();
    const currentStagedFiles = currentChatFiles.filter((f) => stagedFileIds.has(f.id));
    
    if (!trimmed && currentStagedFiles.length === 0) {
      return;
    }

    const attachments = currentStagedFiles.map((f) => ({
      name: f.fileName,
      url: f.url,
      contentType: "application/octet-stream", // Fallback, could be refined
    }));

    setInput("");
    setEditingMessageId(null);
    setStagedFileIds(new Set());

    await chat.sendMessage({
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: trimmed }],
      attachments,
    } as ChatMessage);
  };

  const startNewChat = () => {
    const nextId = generateUUID();
    setDraftChatId(nextId);
    setInput("");
    setEditingMessageId(null);
    setArtifact({ ...INITIAL_ARTIFACT, metadata: createInitialArtifactMetadata() });
    chat.setMessages([]);
    router.push("/assistant");
  };

  const beginEdit = async (messageId: string, currentText: string) => {
    await fetch(`/api/v1/messages?messageId=${messageId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const currentMessages = chat.messages;
    const targetIndex = currentMessages.findIndex((message) => message.id === messageId);
    if (targetIndex >= 0) {
      chat.setMessages(currentMessages.slice(0, targetIndex));
    }

    setEditingMessageId(messageId);
    setInput(currentText);
  };

  const saveArtifact = async (nextContent: string) => {
    if (!artifact.id || artifact.id === "init") {
      toast.error("No active artifact to save.");
      return;
    }

    try {
      const response = await fetch(`/api/v1/document?id=${artifact.id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: artifact.title,
          kind: artifact.kind,
          content: nextContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save document.");
      }

      setArtifact((current: ArtifactState) => ({
        ...current,
        content: nextContent,
        status: "idle",
        metadata: {
          ...current.metadata,
          suggestions: [],
        },
      }));

      // Refresh version history
      void mutate(`/api/v1/document?id=${artifact.id}`);
      void mutate(`/api/v1/document?chatId=${chatId}`);

      toast.success("Artifact saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save artifact.");
    }
  };

  const executeCode = async (code: string, language: string) => {
    const outputId = generateUUID();
    setArtifact((current: ArtifactState) => ({
      ...current,
      metadata: {
        ...current.metadata,
        outputs: [
          ...current.metadata.outputs,
          {
            id: outputId,
            code,
            language,
            status: "in_progress",
            stdout: "",
            stderr: "",
            exitCode: null,
            duration: null,
          },
        ],
      },
    }));

    try {
      const response = await fetch("/api/v1/execute", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Execution failed.");
      }

      const result = await response.json();
      setArtifact((current) => ({
        ...current,
        metadata: {
          ...current.metadata,
          outputs: current.metadata.outputs.map((output: ArtifactExecutionOutput) =>
            output.id === outputId
              ? {
                  ...output,
                  duration: result.duration,
                  exitCode: result.exitCode,
                  status: result.exitCode === 0 ? "completed" : "failed",
                  stderr: result.stderr ?? "",
                  stdout: result.stdout ?? "",
                }
              : output,
          ),
        },
      }));
      
      if (result.exitCode === 0) {
        toast.success(`Executed successfully in ${result.duration}ms`);
      } else {
        toast.error("Execution failed with errors");
      }
    } catch (error) {
      setArtifact((current: ArtifactState) => ({
        ...current,
        metadata: {
          ...current.metadata,
          outputs: current.metadata.outputs.map((output: ArtifactExecutionOutput) =>
            output.id === outputId
              ? {
                  ...output,
                  duration: null,
                  exitCode: 1,
                  status: "failed",
                  stderr: error instanceof Error ? error.message : "Execution failed.",
                  stdout: "",
                }
              : output,
          ),
        },
      }));
      toast.error(error instanceof Error ? error.message : "Failed to execute code.");
    }
  };

  const { data: artifactVersions } = useSWR<Document[]>(
    artifact.isVisible && artifact.id !== "init" ? `/api/v1/document?id=${artifact.id}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const currentArtifactVersions = useMemo(() => artifactVersions ?? [], [artifactVersions]);
  const currentChatFiles = useMemo(() => chatFiles ?? [], [chatFiles]);
  const stagedChatFiles = useMemo(
    () => currentChatFiles.filter((f) => stagedFileIds.has(f.id)),
    [currentChatFiles, stagedFileIds],
  );

  const latestPersistedArtifact = latestArtifactBundle?.artifact ?? null;
  const latestPersistedArtifactVersions = latestArtifactBundle?.versions ?? [];

  const openLatestArtifact = () => {
    if (!latestPersistedArtifact) {
      return;
    }

    const latestVersion = latestPersistedArtifactVersions.at(-1);
    setArtifact({
      id: latestPersistedArtifact.id,
      title: latestPersistedArtifact.title,
      kind: latestPersistedArtifact.kind,
      content: latestVersion?.content ?? "",
      isVisible: true,
      status: "idle",
      metadata: createInitialArtifactMetadata(),
    });
  };

  const restoreArtifactVersion = async (createdAt: Date) => {
    if (!artifact.id || artifact.id === "init") {
      return;
    }

    const response = await fetch(
      `/api/v1/document?id=${artifact.id}&timestamp=${createdAt.toISOString()}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to restore artifact version.");
    }

    await mutate(`/api/v1/document?id=${artifact.id}`);
    await mutate(`/api/v1/document?chatId=${chatId}`);
    toast.success("Artifact version restored");
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setUploadingFileNames(files.map((file) => file.name));

    try {
      const uploaded = await Promise.all(files.map((file) => uploadChatFile(chatId, file)));
      const newIds = uploaded.map(f => f.id);
      
      setStagedFileIds((prev) => {
        const next = new Set(prev);
        newIds.forEach(id => next.add(id));
        return next;
      });

      if (!routeChatId) {
        router.replace(`/assistant/${chatId}`);
      }
      toast.success(files.length === 1 ? "File attached" : "Files attached");
      await mutate(chatFilesKey);
      await mutate("/api/v1/history?limit=50");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload chat file.");
    } finally {
      setUploadingFileNames([]);
    }
  };

  const removeChatFile = async (fileId: string) => {
    try {
      await deleteChatFile(fileId);
      toast.success("Chat file removed");
      await mutate(chatFilesKey);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove chat file.");
    }
  };

  return {
    chatId,
    title: persistedChat?.title ?? "Looply Assistant",
    messages: chat.messages,
    setMessages: chat.setMessages,
    input,
    setInput,
    sendText,
    stop: chat.stop,
    regenerate: chat.regenerate,
    isLoading,
    status: chat.status,
    isHydrating,
    error: chat.error?.message ?? null,
    startNewChat,
    editingMessageId,
    beginEdit,
    artifact,
    setArtifact,
    sendMessage: chat.sendMessage,
    saveArtifact,
    artifactVersions: currentArtifactVersions,
    latestPersistedArtifact,
    latestPersistedArtifactVersions,
    openLatestArtifact,
    chatFiles: stagedChatFiles,
    uploadingFileNames,
    uploadFiles,
    executeCode,
    restoreArtifactVersion,
    removeChatFile,
  };
}
