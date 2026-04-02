import type { CreateDocumentInput, DocumentRecord } from "./upload.types";

export interface IDocumentRepository {
  findById(id: string): Promise<DocumentRecord | null>;
  findByActor(actorId: string): Promise<DocumentRecord[]>;
  findInContext(): Promise<DocumentRecord[]>;
  findInContextByActor(actorId: string): Promise<DocumentRecord[]>;
  create(input: CreateDocumentInput): Promise<DocumentRecord>;
  delete(id: string): Promise<void>;
  toggleContext(id: string, inContext: boolean): Promise<DocumentRecord | null>;
}
