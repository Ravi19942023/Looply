"use client";

import { Badge, Button, Card } from "@/components/atoms";
import { EmptyState } from "@/components/feedback";
import { Toggle } from "@/components/forms";
import type { UploadedDocument } from "../types";
import { cn } from "@/lib/utils";
import { FileText, Database, Trash2, Loader2 } from "lucide-react";

export function DocumentList({
  documents,
  deletingIds,
  onDelete,
  onToggle,
  className,
}: Readonly<{
  documents: UploadedDocument[];
  deletingIds: Set<string>;
  onDelete: (id: string, fileName: string) => void;
  onToggle: (id: string, inContext: boolean) => void;
  className?: string;
}>) {
  if (documents.length === 0) {
    return (
      <EmptyState
        description="Select and upload documents to begin synthesizing your knowledge base."
        title="Knowledge Base Empty"
      />
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {documents.map((document) => {
        const isDeleting = deletingIds.has(document.id);

        return (
          <Card
            key={document.id}
            title={document.fileName}
            className={cn(
              "group hover:ring-2 hover:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm border-border/40",
              isDeleting && "opacity-50 pointer-events-none"
            )}
          >
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between">
                <Badge
                  label={document.inContext ? "Contextualized" : "Staged"}
                  status={document.inContext ? "completed" : "pending"}
                />
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tight">
                  <Database className="size-3" />
                  <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/20 group/info transition-colors hover:bg-muted/50">
                <div className="size-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover/info:text-primary transition-colors">
                  <FileText className="size-4" />
                </div>
                <div className="space-y-0.5">
                   <p className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/30">Intelligence Map</p>
                   <p className="text-sm font-semibold text-foreground tracking-tight">{document.chunkCount} Neural Chunks</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <Toggle
                    label={document.inContext ? "Active" : "Archived"}
                    checked={Boolean(document.inContext)}
                    onCheckedChange={(checked) => onToggle(document.id, checked)}
                  />
                </div>
                
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5"
                  disabled={isDeleting}
                  onClick={() => onDelete(document.id, document.fileName)}
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
