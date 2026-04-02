import type { Suggestion } from "@/lib/db/schema";
import type { ArtifactKind } from "@/lib/types";

export type ArtifactStatus = "idle" | "streaming";

export type ArtifactOutputStatus = "in_progress" | "completed" | "failed";

export type ArtifactExecutionOutput = {
  id: string;
  code: string;
  language: string;
  status: ArtifactOutputStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number | null;
};

export type ArtifactMetadata = {
  suggestions: Suggestion[];
  outputs: ArtifactExecutionOutput[];
};

export type ArtifactState = {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: ArtifactStatus;
  metadata: ArtifactMetadata;
};

export function createInitialArtifactMetadata(): ArtifactMetadata {
  return {
    suggestions: [],
    outputs: [],
  };
}

export const INITIAL_ARTIFACT_METADATA: ArtifactMetadata = {
  suggestions: [],
  outputs: [],
};
