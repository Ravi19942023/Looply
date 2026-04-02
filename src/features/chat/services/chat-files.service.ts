import { apiClient } from "@/lib/api";

export interface SessionChatFile {
  id: string;
  chatId: string;
  actorId: string;
  key: string;
  url: string;
  fileName: string;
  fileSize: number;
  chunkCount: number;
  createdAt: string;
}

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

export async function fetchChatFiles(chatId: string): Promise<SessionChatFile[]> {
  return apiClient<SessionChatFile[]>(`/api/v1/chat-files?chatId=${chatId}`);
}

export async function uploadChatFile(chatId: string, file: File): Promise<SessionChatFile> {
  return apiClient<SessionChatFile>("/api/v1/chat-files", {
    method: "POST",
    body: JSON.stringify({
      chatId,
      fileName: file.name,
      contentType: file.type || "text/plain",
      contentBase64: await toBase64(file),
    }),
  });
}

export async function deleteChatFile(id: string): Promise<void> {
  await apiClient<void>(`/api/v1/chat-files/${id}`, {
    method: "DELETE",
  });
}
