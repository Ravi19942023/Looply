import type { ChatMessage } from "@/lib/types";

export interface ToolUsageTelemetry {
  chatId: string;
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  stepIndex: number;
}

export interface TokenUsageTelemetry {
  actorId: string;
  chatId: string;
  source: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Simplified SDK event types for internal handlers
 * Mirrors standard Vercel AI SDK event shapes to avoid complex generic bloat while maintaining type safety.
 */
export interface StepFinishArgs {
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args?: any;
  }>;
  toolResults?: Array<{
    toolCallId: string;
    result: any;
  }>;
}

export interface FinishArgs {
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type { ChatMessage };
