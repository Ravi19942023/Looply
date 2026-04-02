import { z } from "zod";

export const artifactKindSchema = z.enum(["text", "code", "sheet"]);

export const chatPartSchema = z.record(z.string(), z.any());

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["system", "user", "assistant", "tool"]),
  parts: z.array(chatPartSchema),
  attachments: z.array(z.any()).optional(),
});

export const chatSubmitSchema = z.object({
  id: z.string().uuid(),
  messages: z.array(chatMessageSchema).min(1),
});

export const artifactUpdateSchema = z.object({
  title: z.string().min(1),
  kind: artifactKindSchema,
  content: z.string(),
});
