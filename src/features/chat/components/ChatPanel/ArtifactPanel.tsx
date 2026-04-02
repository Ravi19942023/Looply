/* eslint-disable max-lines */
"use client";

import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Loader2,
  PanelRightClose,
  RotateCcw,
  Save,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { Document } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { getArtifactDefinition } from "./artifact-registry";
import type { ArtifactAction, ArtifactToolbarItem } from "./create-artifact";
import type {
  ArtifactExecutionOutput,
  ArtifactMetadata,
  ArtifactState,
} from "../../types/artifact.types";
import type { ChatMessage } from "@/lib/types";
import type { UseChatHelpers } from "@ai-sdk/react";

function ArtifactActionButton({
  action,
  disabled,
  onClick,
}: Readonly<{
  action: ArtifactAction;
  disabled: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      className="inline-flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-background/90 text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title={action.description}
      type="button"
    >
      {action.icon}
    </button>
  );
}

function ArtifactToolbarButton({
  artifact,
  item,
  sendMessage,
}: Readonly<{
  artifact: ArtifactState;
  item: ArtifactToolbarItem;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
}>) {
  return (
    <button
      className="inline-flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-background/90 text-muted-foreground transition hover:text-foreground"
      onClick={() => item.onClick({ artifact, sendMessage })}
      title={item.description}
      type="button"
    >
      {item.icon}
    </button>
  );
}

function ExecutionConsole({
  outputs,
}: Readonly<{
  outputs: ArtifactExecutionOutput[];
}>) {
  if (outputs.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">Execution Output</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">
          {outputs.length} run{outputs.length === 1 ? "" : "s"}
        </div>
      </div>
      <div className="max-h-64 space-y-4 overflow-y-auto p-4">
        {[...outputs].reverse().map((output) => {
          const isRunning = output.status === "in_progress";
          const isSuccess = output.status === "completed" && output.exitCode === 0;
          const stateLabel = isRunning ? "Running" : isSuccess ? "Completed" : "Failed";

          return (
            <div key={output.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                  {isRunning ? <Loader2 className="size-4 animate-spin text-blue-400" /> : null}
                  {!isRunning && isSuccess ? <CheckCircle2 className="size-4 text-emerald-400" /> : null}
                  {!isRunning && !isSuccess ? <RotateCcw className="size-4 text-rose-400" /> : null}
                  <span>{stateLabel}</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                  {output.language}
                </div>
              </div>

              {output.stdout ? (
                <pre className="whitespace-pre-wrap break-words rounded-2xl bg-emerald-500/8 p-3 font-mono text-xs leading-5 text-emerald-300">
                  {output.stdout}
                </pre>
              ) : null}

              {output.stderr ? (
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-rose-500/8 p-3 font-mono text-xs leading-5 text-rose-300">
                  {output.stderr}
                </pre>
              ) : null}

              {!output.stdout && !output.stderr && isRunning ? (
                <div className="rounded-2xl bg-blue-500/8 p-3 font-mono text-xs text-blue-300">
                  Running code locally...
                </div>
              ) : null}

              <div className="mt-3 text-right text-[10px] uppercase tracking-[0.2em] text-white/35">
                Exit {output.exitCode ?? "pending"} {output.duration != null ? `• ${output.duration}ms` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ArtifactPanel = memo(function ArtifactPanel({
  artifact,
  onClose,
  onExecuteCode,
  onRestoreVersion,
  onSave,
  sendMessage,
  versions,
}: Readonly<{
  artifact: ArtifactState;
  onClose: () => void;
  onExecuteCode?: (code: string, language: string) => void;
  onRestoreVersion: (createdAt: Date) => Promise<void>;
  onSave: (nextContent: string) => Promise<void>;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  versions: Document[];
}>) {
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number | null>(null);
  const noopSetMetadata = useCallback<Dispatch<SetStateAction<ArtifactMetadata>>>(
    (_value) => undefined,
    [],
  );

  useEffect(() => {
    setDraftContent(null);
    setSelectedVersionIndex(null);
  }, [artifact.id]);

  const definition = getArtifactDefinition(artifact.kind);

  const currentVersionIndex = selectedVersionIndex ?? Math.max(versions.length - 1, 0);
  const isCurrentVersion = selectedVersionIndex === null || currentVersionIndex >= versions.length - 1;
  const selectedVersion = selectedVersionIndex != null ? versions[selectedVersionIndex] : null;
  const displayContent = selectedVersion ? selectedVersion.content ?? "" : draftContent ?? artifact.content;
  const latestVersion = versions.at(-1);

  const getDocumentContentById = useCallback(
    (index: number) => versions[index]?.content ?? "",
    [versions],
  );

  const handleVersionChange = useCallback(
    (type: "next" | "prev" | "latest") => {
      if (versions.length === 0) {
        return;
      }

      if (type === "latest") {
        setSelectedVersionIndex(null);
        return;
      }

      setSelectedVersionIndex((current) => {
        const baseIndex = current ?? versions.length - 1;
        if (type === "prev") {
          return Math.max(0, baseIndex - 1);
        }
        return Math.min(versions.length - 1, baseIndex + 1);
      });
    },
    [versions.length],
  );

  const handleSaveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      setSelectedVersionIndex(null);
      setDraftContent(updatedContent);
      if (!debounce) {
        void onSave(updatedContent);
      }
    },
    [onSave],
  );

  const handleRestore = useCallback(async () => {
    if (selectedVersionIndex == null || !versions[selectedVersionIndex]) {
      return;
    }

    setIsRestoring(true);
    try {
      await onRestoreVersion(versions[selectedVersionIndex].createdAt);
      setSelectedVersionIndex(null);
      setDraftContent(null);
    } finally {
      setIsRestoring(false);
    }
  }, [onRestoreVersion, selectedVersionIndex, versions]);

  const actionContext = useMemo(
    () => ({
      artifact,
      content: displayContent,
      currentVersionIndex,
      getDocumentContentById,
      handleVersionChange,
      isCurrentVersion,
      metadata: artifact.metadata,
      onExecuteCode,
      setMetadata: noopSetMetadata,
    }),
    [
      artifact,
      currentVersionIndex,
      displayContent,
      getDocumentContentById,
      handleVersionChange,
      isCurrentVersion,
      onExecuteCode,
      noopSetMetadata,
    ],
  );

  if (!artifact.isVisible) {
    return null;
  }

  const WorkspaceContent = definition.content;

  return (
    <aside className="hidden w-[44%] shrink-0 border-l border-border/60 bg-sidebar xl:flex xl:flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            {definition.icon}
            <span className="truncate">{artifact.title || `Untitled ${definition.label}`}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {artifact.status === "streaming"
              ? "Generating live..."
              : latestVersion
                ? `Updated ${formatDistanceToNow(new Date(latestVersion.createdAt), { addSuffix: true })}`
                : "No saved versions yet"}
          </p>
        </div>
        <button
          aria-label="Close artifact"
          className="inline-flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-background transition hover:bg-muted"
          onClick={onClose}
          type="button"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>

      <div className="border-b border-border/60 px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {versions.map((version, index) => {
            const isSelected = index === currentVersionIndex && !isCurrentVersion;

            return (
              <button
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
                )}
                key={`${version.id}-${version.createdAt.toString()}`}
                onClick={() => {
                  setDraftContent(null);
                  setSelectedVersionIndex((current) => (current === index ? null : index));
                }}
                type="button"
              >
                V{index + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col px-5 py-4" data-slot="artifact-content">
        <div className="relative flex-1 overflow-y-auto rounded-[28px] border border-border/60 bg-background p-4 shadow-inner">
          <WorkspaceContent
            content={displayContent}
            currentVersionIndex={currentVersionIndex}
            getDocumentContentById={getDocumentContentById}
            isCurrentVersion={isCurrentVersion}
            isInline={false}
            metadata={artifact.metadata}
            onSaveContent={handleSaveContent}
            setMetadata={noopSetMetadata}
            status={artifact.status}
            suggestions={artifact.metadata.suggestions}
          />

          <div className="absolute right-6 bottom-6 z-10 flex flex-col gap-2">
            {definition.actions.map((action: ArtifactAction) => {
              const disabled =
                artifact.status === "streaming" ||
                (action.isDisabled ? action.isDisabled(actionContext) : false);

              return (
                <ArtifactActionButton
                  action={action}
                  disabled={disabled}
                  key={action.description}
                  onClick={() => {
                    void Promise.resolve(action.onClick(actionContext));
                  }}
                />
              );
            })}

            {definition.toolbar.map((item: ArtifactToolbarItem) => (
              <ArtifactToolbarButton
                artifact={artifact}
                item={item}
                key={item.description}
                sendMessage={sendMessage}
              />
            ))}
          </div>
        </div>

        {artifact.kind === "code" ? <ExecutionConsole outputs={artifact.metadata.outputs} /> : null}

        <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-border/60 bg-background/80 px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{definition.mediaTypeLabel}</span>
            {versions.length > 0 ? <span>{currentVersionIndex + 1} / {versions.length}</span> : null}
          </div>
          <div className="flex items-center gap-2">
            {!isCurrentVersion ? (
              <>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl border border-border/60 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isRestoring}
                  onClick={() => {
                    void handleRestore();
                  }}
                  type="button"
                >
                  {isRestoring ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                  Restore
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl border border-border/60 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  onClick={() => handleVersionChange("latest")}
                  type="button"
                >
                  Latest
                </button>
              </>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={artifact.status === "streaming"}
              onClick={() => {
                void onSave(draftContent ?? artifact.content);
              }}
              type="button"
            >
              <Save className="size-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
});
