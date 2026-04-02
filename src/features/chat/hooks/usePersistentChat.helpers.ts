import type { ArtifactState } from "../types/artifact.types";
import { createInitialArtifactMetadata } from "../types/artifact.types";

export type { ArtifactState } from "../types/artifact.types";

export const INITIAL_ARTIFACT: ArtifactState = {
  id: "init",
  title: "",
  kind: "text",
  content: "",
  isVisible: false,
  status: "idle",
  metadata: createInitialArtifactMetadata(),
};

export const DRAFT_STORAGE_KEY = "looply-assistant-draft";

export function extractChatId(pathname: string | null): string | null {
  if (!pathname) {
    return null;
  }

  const match = pathname.match(/^\/assistant\/([^/]+)$/);
  return match?.[1] ?? null;
}
