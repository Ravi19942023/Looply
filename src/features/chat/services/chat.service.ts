/**
 * Re-export readUIMessageStream for any code that still needs it directly.
 * The primary transport is now configured inside useChatStream via useChat.
 */
export { readUIMessageStream } from "ai";
