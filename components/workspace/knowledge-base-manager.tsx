"use client";

import { FileUpIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageShell } from "./page-shell";

type KnowledgeEntry = {
  chunkCount: number | null;
  content: string;
  contentType: string | null;
  createdAt: string;
  createdBy: string;
  fileName: string | null;
  fileSize: number | null;
  id: string;
  inContext: boolean;
  key: string | null;
  source: string;
  title: string;
  updatedAt: string;
  url: string | null;
};

type UploadStatus = "complete" | "error" | "idle" | "processing" | "uploading";

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return "Curated";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgeBaseManager() {
  const [documents, setDocuments] = useState<KnowledgeEntry[]>([]);
  const [query, setQuery] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      const response = await fetch("/api/knowledge-base");
      const data = (await response.json()) as KnowledgeEntry[];
      setDocuments(data);
    }

    loadDocuments().catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return documents;
    }
    return documents.filter((document) => {
      return (
        document.title.toLowerCase().includes(normalizedQuery) ||
        document.content.toLowerCase().includes(normalizedQuery) ||
        (document.fileName ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [documents, query]);

  const handleUpload = async (file: File) => {
    setUploadStatus("uploading");
    setUploadProgress(25);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Unable to upload document.");
      }

      setUploadStatus("processing");
      setUploadProgress(85);
      const document = (await response.json()) as KnowledgeEntry;
      setDocuments((current) => [document, ...current]);
      setUploadProgress(100);
      setUploadStatus("complete");
      toast.success("Knowledge document uploaded");
    } catch (error) {
      setUploadStatus("error");
      setUploadError(
        error instanceof Error ? error.message : "Unable to upload document."
      );
    } finally {
      window.setTimeout(() => {
        setUploadStatus("idle");
        setUploadProgress(0);
      }, 2000);
    }
  };

  const toggleContext = async (id: string, inContext: boolean) => {
    const previous = documents;
    setDocuments((current) =>
      current.map((item) => (item.id === id ? { ...item, inContext } : item))
    );

    const response = await fetch(`/api/knowledge-base/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inContext }),
    });

    if (!response.ok) {
      setDocuments(previous);
      const data = await response
        .json()
        .catch(() => ({ error: "Update failed" }));
      toast.error(data.error ?? "Unable to update document context");
    }
  };

  const deleteDocument = async (id: string) => {
    setDeletingIds((current) => new Set(current).add(id));

    try {
      const response = await fetch(`/api/knowledge-base/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({ error: "Delete failed" }));
        throw new Error(data.error ?? "Delete failed");
      }

      setDocuments((current) => current.filter((item) => item.id !== id));
      toast.success("Knowledge document deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete document"
      );
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <PageShell
      description="Upload, review, and manage the documents that the assistant can use during retrieval."
      title="Knowledge Base"
    >
      {uploadError ? (
        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {uploadError}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <button
          className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/60 p-6 text-center shadow-[var(--shadow-card)] transition hover:bg-card/80"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <FileUpIcon className="size-8 text-muted-foreground" />
          <div className="mt-4 text-base font-semibold">Upload document</div>
          <div className="mt-2 max-w-xs text-sm text-muted-foreground">
            PDF, DOCX, or TXT up to 25MB. Uploaded documents are parsed,
            chunked, embedded, and indexed automatically.
          </div>
          {uploadStatus !== "idle" ? (
            <div className="mt-5 w-full max-w-xs">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{uploadStatus}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-foreground transition-[width]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : null}
        </button>

        <div className="rounded-3xl border border-border/40 bg-card/60 p-4 shadow-[var(--shadow-card)]">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search uploaded and curated knowledge"
            value={query}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-background/70 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
                Documents
              </div>
              <div className="mt-1 text-2xl font-bold">{documents.length}</div>
            </div>
            <div className="rounded-2xl bg-background/70 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
                In Context
              </div>
              <div className="mt-1 text-2xl font-bold">
                {documents.filter((document) => document.inContext).length}
              </div>
            </div>
            <div className="rounded-2xl bg-background/70 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
                Uploaded
              </div>
              <div className="mt-1 text-2xl font-bold">
                {
                  documents.filter((document) => document.source === "upload")
                    .length
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            handleUpload(file).catch(() => undefined);
          }
          event.currentTarget.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />

      <div className="space-y-3">
        {filtered.map((document) => (
          <div
            className="rounded-3xl border border-border/40 bg-card/60 px-5 py-4 shadow-[var(--shadow-card)]"
            key={document.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold">
                  {document.fileName ?? document.title}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {document.source === "upload"
                    ? `${formatFileSize(document.fileSize)} • ${document.chunkCount ?? 0} chunks`
                    : "Curated seed document"}
                </div>
              </div>
              <button
                className="inline-flex size-9 items-center justify-center rounded-xl border border-border/40 bg-background/70 text-muted-foreground transition hover:text-destructive"
                disabled={deletingIds.has(document.id)}
                onClick={() => {
                  deleteDocument(document.id).catch(() => undefined);
                }}
                type="button"
              >
                {deletingIds.has(document.id) ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <Trash2Icon className="size-4" />
                )}
              </button>
            </div>

            <div className="mt-4 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {document.content}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={document.inContext}
                  className="size-4 rounded border-border"
                  onChange={(event) => {
                    toggleContext(document.id, event.target.checked).catch(
                      () => undefined
                    );
                  }}
                  type="checkbox"
                />
                In retrieval context
              </label>

              <div className="text-xs text-muted-foreground">
                Updated{" "}
                {new Date(document.updatedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
