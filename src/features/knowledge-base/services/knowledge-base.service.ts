import { API_ENDPOINTS } from "@/shared/constants";
import { apiClient } from "@/lib/api";

import type { UploadedDocument } from "../types";

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read file."));
        return;
      }

      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

export async function fetchDocuments(): Promise<UploadedDocument[]> {
  return apiClient<UploadedDocument[]>(API_ENDPOINTS.UPLOADS);
}

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  return apiClient<UploadedDocument>(API_ENDPOINTS.UPLOADS, {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "text/plain",
      contentBase64: await toBase64(file),
    }),
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient<void>(API_ENDPOINTS.UPLOAD(id), {
    method: "DELETE",
  });
}

export async function toggleDocumentContext(id: string, inContext: boolean): Promise<UploadedDocument> {
  return apiClient<UploadedDocument>(API_ENDPOINTS.UPLOAD(id), {
    method: "PATCH",
    body: JSON.stringify({ inContext }),
  });
}
