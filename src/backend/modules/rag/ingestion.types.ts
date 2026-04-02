export interface DocumentMetadata {
  actorId: string;
  documentId: string;
  fileName: string;
  key: string;
  url: string;
}

export interface IngestResult {
  chunkCount: number;
}

export interface IngestionConfig {
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
}
