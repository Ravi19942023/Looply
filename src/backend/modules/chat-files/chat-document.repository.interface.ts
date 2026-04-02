import type { ChatDocumentRecord, CreateChatDocumentInput } from "./chat-file.types";

export interface IChatDocumentRepository {
  findById(id: string): Promise<ChatDocumentRecord | null>;
  findByChat(chatId: string): Promise<ChatDocumentRecord[]>;
  findByChatAndActor(chatId: string, actorId: string): Promise<ChatDocumentRecord[]>;
  create(input: CreateChatDocumentInput): Promise<ChatDocumentRecord>;
  delete(id: string): Promise<void>;
}
