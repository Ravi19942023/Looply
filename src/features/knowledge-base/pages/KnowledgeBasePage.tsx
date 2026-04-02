"use client";

import { useState } from "react";
import { PageHeader } from "@/components/data-display";
import { ConfirmationDialog } from "@/components/feedback";
import { DocumentList, UploadDropZone, UploadProgress } from "../components";
import { useKnowledgeBase } from "../hooks";

export function KnowledgeBasePage() {
  const {
    documents,
    uploadStatus,
    uploadProgress,
    uploadError,
    deletingIds,
    addDocument,
    removeDocument,
    updateInContext,
  } = useKnowledgeBase();

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; fileName: string } | null>(null);
  const isDeleting = deleteTarget ? deletingIds.has(deleteTarget.id) : false;

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    void removeDocument(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        description="Upload, review, and manage the documents that Looply AI can use for retrieval."
        eyebrow="Knowledge Base"
        title="Knowledge Base"
      />

      {uploadError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {uploadError}
        </div>
      ) : null}

      <div className="space-y-8">
        <div className="animate-fade-up">
          <UploadDropZone
            onFileSelect={(file) => void addDocument(file)}
            disabled={uploadStatus === "uploading"}
          />
        </div>

        {uploadStatus !== "idle" && (
          <div className="animate-fade-in">
            <UploadProgress
              fileName="Document upload"
              progress={uploadProgress}
              status={uploadStatus}
            />
          </div>
        )}

        <div className="animate-fade-up [animation-delay:100ms]">
          <DocumentList
            documents={documents}
            deletingIds={deletingIds}
            onDelete={(id, fileName) => setDeleteTarget({ id, fileName })}
            onToggle={(id, inContext) => void updateInContext(id, inContext)}
          />
        </div>
      </div>

      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        title="Delete Document"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.fileName}"? This action cannot be undone. The document and all its indexed chunks will be permanently removed.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
