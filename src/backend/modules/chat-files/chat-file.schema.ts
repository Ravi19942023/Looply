import { z } from "zod";

export const UploadChatDocumentRequestSchema = z.object({
  chatId: z.string().uuid(),
  fileName: z.string().min(1).max(500),
  contentType: z.string().min(1),
  contentBase64: z.string().min(1),
});
