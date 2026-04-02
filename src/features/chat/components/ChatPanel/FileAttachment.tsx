"use client";

import { Sparkles } from "lucide-react";
import type { Attachment } from "../../types/chat.types";

interface FileAttachmentProps {
  name: string;
  url: string;
}

export function FileAttachment({ name, url }: FileAttachmentProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-xs transition-colors hover:bg-muted/50 max-w-[240px]">
      <div className="flex size-7 items-center justify-center rounded-lg bg-background shadow-sm">
        <Sparkles className="size-3.5 text-primary" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="truncate font-medium text-foreground">{name}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Document</span>
      </div>
    </div>
  );
}
