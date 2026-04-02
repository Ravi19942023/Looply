import { z } from "zod";

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string().optional().default(""),
  parts: z.array(z.any()).optional(),
});

export const ChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  messages: z.array(ChatMessageSchema).min(1),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
