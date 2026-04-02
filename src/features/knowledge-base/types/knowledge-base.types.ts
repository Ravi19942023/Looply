export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  chunkCount: number;
  inContext: boolean | null;
  createdAt: string;
  url: string;
}

export type UploadStatus = "idle" | "uploading" | "processing" | "complete" | "error";
