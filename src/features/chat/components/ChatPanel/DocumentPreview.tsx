"use client";

import { Loader2, Maximize2 } from "lucide-react";
import { memo, useCallback } from "react";
import { getArtifactDefinition } from "./artifact-registry";
import type { ArtifactStatus } from "../../types/artifact.types";
import type { ArtifactKind } from "@/lib/types";

interface DocumentPreviewProps {
  id: string;
  title: string;
  kind: ArtifactKind;
  content?: string;
  status?: ArtifactStatus;
  onOpen: (id: string, title?: string, kind?: ArtifactKind, content?: string) => void;
}

export const DocumentPreview = memo(function DocumentPreview({
  id,
  title,
  kind,
  content = "",
  status = "idle",
  onOpen,
}: DocumentPreviewProps) {
  const definition = getArtifactDefinition(kind);
  const isStreaming = status === "streaming";
  const PreviewContent = definition.preview;

  const handleOpen = useCallback(() => {
    onOpen(id, title, kind, content);
  }, [content, id, kind, onOpen, title]);

  return (
    <button
      className="group relative my-2 block w-full max-w-[460px] overflow-hidden rounded-[28px] border border-border/60 bg-card/70 text-left shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
      onClick={handleOpen}
      type="button"
    >
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-background ring-1 ring-border/50">
            {isStreaming ? <Loader2 className="size-4 animate-spin text-primary" /> : definition.icon}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-foreground">
              {title || `Untitled ${definition.label}`}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              {isStreaming ? "Streaming artifact" : definition.mediaTypeLabel}
            </div>
          </div>
        </div>
        <div className="flex size-8 items-center justify-center rounded-xl bg-background/70 text-muted-foreground opacity-0 transition group-hover:opacity-100">
          <Maximize2 className="size-4" />
        </div>
      </div>

      <div className="relative h-[220px] overflow-hidden bg-muted/10 p-4">
        <div className="pointer-events-none absolute inset-0 scale-[0.62] origin-top-left p-5">
          <div className="h-[161.29%] w-[161.29%]">
            <PreviewContent content={content} status={status} />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/70 to-transparent" />
        {isStreaming ? (
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%] animate-shimmer" />
        ) : null}
      </div>
    </button>
  );
});
