"use client";

import { FileInput } from "@/components/forms";
import { cn } from "@/lib/utils";
import { UploadCloud, Loader2 } from "lucide-react";

export function UploadDropZone({
  onFileSelect,
  disabled,
  className,
}: Readonly<{
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}>) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 transition-all gap-6 group text-center",
      disabled
        ? "border-border/20 bg-background/10 opacity-60 pointer-events-none"
        : "border-border/40 bg-background/30 hover:bg-background/50 hover:border-primary/40",
      className
    )}>
      <div className={cn(
        "size-12 rounded-full flex items-center justify-center transition-transform duration-500",
        disabled ? "bg-muted text-muted-foreground" : "bg-primary/5 text-primary group-hover:scale-110"
      )}>
        {disabled ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          {disabled ? "Uploading..." : "Upload knowledge assets"}
        </h3>
        <p className="text-[11px] text-muted-foreground/50 font-medium leading-relaxed max-w-[240px]">
          Accepted formats: PDF, DOCX, TXT. <br /> Maximum size: 25MB per file.
        </p>
      </div>

      <FileInput
        accept=".pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        label="Select Document"
        disabled={disabled}
        onFilesChange={(files) => {
          const file = files?.[0];
          if (file) {
            onFileSelect(file);
          }
        }}
      />
    </div>
  );
}
