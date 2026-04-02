"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import type { Suggestion } from "@/lib/db/schema";
import type { ChatMessage, CustomUIDataTypes } from "@/lib/types";
import type { ArtifactMetadata, ArtifactState, ArtifactStatus } from "../../types/artifact.types";

export type ArtifactActionContext = {
  artifact: ArtifactState;
  content: string;
  currentVersionIndex: number;
  getDocumentContentById: (index: number) => string;
  handleVersionChange: (type: "next" | "prev" | "latest") => void;
  isCurrentVersion: boolean;
  metadata: ArtifactMetadata;
  onExecuteCode?: (code: string, language: string) => void;
  setMetadata: Dispatch<SetStateAction<ArtifactMetadata>>;
};

export type ArtifactAction = {
  description: string;
  icon: ReactNode;
  label?: string;
  onClick: (context: ArtifactActionContext) => Promise<void> | void;
  isDisabled?: (context: ArtifactActionContext) => boolean;
};

export type ArtifactToolbarContext = {
  artifact: ArtifactState;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
};

export type ArtifactToolbarItem = {
  description: string;
  icon: ReactNode;
  onClick: (context: ArtifactToolbarContext) => void;
};

export type ArtifactContentProps = {
  content: string;
  currentVersionIndex: number;
  getDocumentContentById: (index: number) => string;
  isCurrentVersion: boolean;
  isInline: boolean;
  metadata: ArtifactMetadata;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  setMetadata: Dispatch<SetStateAction<ArtifactMetadata>>;
  status: ArtifactStatus;
  suggestions: Suggestion[];
};

export type ArtifactPreviewProps = {
  content: string;
  status: ArtifactStatus;
};

export type ArtifactStreamPart = {
  data?: unknown;
  type?: keyof CustomUIDataTypes | string;
};

type ArtifactConfig<T extends ArtifactState["kind"]> = {
  actions: ArtifactAction[];
  content: ComponentType<ArtifactContentProps>;
  description: string;
  icon: ReactNode;
  kind: T;
  label: string;
  mediaTypeLabel: string;
  onStreamPart: (args: {
    setArtifact: Dispatch<SetStateAction<ArtifactState>>;
    streamPart: ArtifactStreamPart;
  }) => void;
  preview: ComponentType<ArtifactPreviewProps>;
  toolbar: ArtifactToolbarItem[];
};

export class ArtifactDefinition<T extends ArtifactState["kind"]> {
  readonly actions: ArtifactAction[];
  readonly content: ComponentType<ArtifactContentProps>;
  readonly description: string;
  readonly icon: ReactNode;
  readonly kind: T;
  readonly label: string;
  readonly mediaTypeLabel: string;
  readonly onStreamPart: ArtifactConfig<T>["onStreamPart"];
  readonly preview: ComponentType<ArtifactPreviewProps>;
  readonly toolbar: ArtifactToolbarItem[];

  constructor(config: ArtifactConfig<T>) {
    this.actions = config.actions;
    this.content = config.content;
    this.description = config.description;
    this.icon = config.icon;
    this.kind = config.kind;
    this.label = config.label;
    this.mediaTypeLabel = config.mediaTypeLabel;
    this.onStreamPart = config.onStreamPart;
    this.preview = config.preview;
    this.toolbar = config.toolbar;
  }
}
