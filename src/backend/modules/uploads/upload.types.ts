export interface DocumentRecord {
  id: string;
  actorId: string;
  key: string;
  url: string;
  fileName: string;
  fileSize: number;
  chunkCount: number;
  inContext: boolean | null;
  createdAt: Date;
}

export interface CreateDocumentInput {
  actorId: string;
  key: string;
  url: string;
  fileName: string;
  fileSize: number;
  chunkCount: number;
  inContext?: boolean;
}

export interface UploadDocumentInput {
  actorId: string;
  fileName: string;
  contentType: string;
  content: Buffer;
}

export interface UploadDocumentRequest {
  fileName: string;
  contentType: string;
  contentBase64: string;
}
