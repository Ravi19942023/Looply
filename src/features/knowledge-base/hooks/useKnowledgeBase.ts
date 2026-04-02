"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  deleteDocument,
  fetchDocuments,
  toggleDocumentContext,
  uploadDocument,
} from "../services";
import type { UploadedDocument, UploadStatus } from "../types";

export function useKnowledgeBase() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const uploadAbortRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      try {
        const items = await fetchDocuments();
        if (active) {
          setDocuments(items);
        }
      } catch (caughtError) {
        if (active) {
          setUploadError(caughtError instanceof Error ? caughtError.message : "Unable to load documents.");
        }
      }
    }

    void loadDocuments();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (uploadStatus !== "complete") return;
    const timer = setTimeout(() => {
      setUploadStatus("idle");
      setUploadProgress(0);
    }, 3000);
    return () => clearTimeout(timer);
  }, [uploadStatus]);

  const addDocument = useCallback(async (file: File) => {
    if (uploadAbortRef.current) return;
    uploadAbortRef.current = true;

    setUploadStatus("uploading");
    setUploadProgress(25);
    setUploadError(null);

    try {
      const document = await uploadDocument(file);
      setUploadProgress(100);
      setUploadStatus("complete");
      setDocuments((current) => [document, ...current]);
    } catch (caughtError) {
      setUploadStatus("error");
      setUploadError(caughtError instanceof Error ? caughtError.message : "Unable to upload document.");
    } finally {
      uploadAbortRef.current = false;
    }
  }, []);

  const removeDocument = useCallback(async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));

    try {
      await deleteDocument(id);
      setDocuments((current) => current.filter((item) => item.id !== id));
    } catch {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const updateInContext = useCallback(async (id: string, inContext: boolean) => {
    const previous = documents.find((d) => d.id === id);
    setDocuments((current) =>
      current.map((item) => (item.id === id ? { ...item, inContext } : item)),
    );

    try {
      const updated = await toggleDocumentContext(id, inContext);
      setDocuments((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch {
      if (previous) {
        setDocuments((current) =>
          current.map((item) => (item.id === id ? previous : item)),
        );
      }
    }
  }, [documents]);

  return {
    documents,
    uploadStatus,
    uploadProgress,
    uploadError,
    deletingIds,
    addDocument,
    removeDocument,
    updateInContext,
  };
}
