export interface ChatDocumentRecord {
  id: string;
  chatId: string;
  actorId: string;
  key: string;
  url: string;
  fileName: string;
  fileSize: number;
  chunkCount: number;
  createdAt: Date;
}

export interface CreateChatDocumentInput {
  chatId: string;
  actorId: string;
  key: string;
  url: string;
  fileName: string;
  fileSize: number;
  chunkCount: number;
}

export interface UploadChatDocumentInput {
  chatId: string;
  actorId: string;
  fileName: string;
  contentType: string;
  content: Buffer;
}

export interface UploadChatDocumentRequest {
  chatId: string;
  fileName: string;
  contentType: string;
  contentBase64: string;
}
