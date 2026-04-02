import { z } from "zod";

export const UploadDocumentSchema = z.object({
  actorId: z.string().uuid(),
  fileName: z.string().min(1).max(500),
  contentType: z.string().min(1),
  content: z.instanceof(Buffer),
});

export const UploadDocumentRequestSchema = z.object({
  fileName: z.string().min(1).max(500),
  contentType: z.string().min(1),
  contentBase64: z.string().min(1),
});

export const ToggleDocumentContextSchema = z.object({
  inContext: z.boolean(),
});
