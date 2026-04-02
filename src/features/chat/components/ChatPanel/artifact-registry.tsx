/* eslint-disable max-lines */
"use client";

import { parse, unparse } from "papaparse";
import { toast } from "sonner";
import type { Dispatch, SetStateAction } from "react";
import {
  BrushCleaning,
  Code2,
  Copy,
  FileText,
  MessageSquareQuote,
  Play,
  SquareChartGantt,
  Table2,
  TerminalSquare,
  Undo2,
  Redo2,
} from "lucide-react";
import { type ArtifactAction, ArtifactDefinition } from "./create-artifact";
import { CodeEditor } from "./CodeEditor";
import { SheetEditor } from "./SheetEditor";
import { TextEditor } from "./TextEditor";
import type { ArtifactState } from "../../types/artifact.types";

const noopSave = (_updatedContent: string, _debounce: boolean) => {};

function copyToClipboard(content: string, successMessage: string) {
  void navigator.clipboard.writeText(content);
  toast.success(successMessage);
}

function buildVersionActions(): ArtifactAction[] {
  return [
    {
      description: "Previous version",
      icon: <Undo2 className="size-4" />,
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      description: "Next version",
      icon: <Redo2 className="size-4" />,
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    },
  ];
}

const TextPreview = ({ content, status }: { content: string; status: ArtifactState["status"] }) => (
  <TextEditor
    content={content}
    currentVersionIndex={0}
    isCurrentVersion={true}
    onSaveContent={noopSave}
    readOnly={true}
    status={status}
    suggestions={[]}
  />
);

const CodePreview = ({ content, status }: { content: string; status: ArtifactState["status"] }) => (
  <CodeEditor
    content={content}
    currentVersionIndex={0}
    isCurrentVersion={true}
    language="javascript"
    onSaveContent={noopSave}
    readOnly={true}
    status={status}
    suggestions={[]}
  />
);

const SheetPreview = ({ content, status }: { content: string; status: ArtifactState["status"] }) => (
  <SheetEditor
    content={content}
    currentVersionIndex={0}
    isCurrentVersion={true}
    onSaveContent={noopSave}
    readOnly={true}
    status={status}
  />
);

export const textArtifactDefinition = new ArtifactDefinition({
  kind: "text",
  label: "Document",
  description: "Rich text artifact workspace for drafted content.",
  mediaTypeLabel: "Document",
  icon: <FileText className="size-4" />,
  preview: TextPreview,
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type !== "data-textDelta") {
      return;
    }

    setArtifact((current) => ({
      ...current,
      content: String(streamPart.data ?? ""),
      isVisible: true,
      status: "streaming",
    }));
  },
  content: ({ content, currentVersionIndex, isCurrentVersion, metadata, onSaveContent, status }) => (
    <div className="flex flex-row px-6 py-8 lg:px-10">
      <TextEditor
        content={content}
        currentVersionIndex={currentVersionIndex}
        isCurrentVersion={isCurrentVersion}
        onSaveContent={onSaveContent}
        status={status}
        suggestions={metadata.suggestions}
      />
    </div>
  ),
  actions: [
    ...buildVersionActions(),
    {
      description: "Copy document",
      icon: <Copy className="size-4" />,
      onClick: ({ content }) => {
        copyToClipboard(content, "Copied document to clipboard");
      },
    },
  ],
  toolbar: [
    {
      description: "Add final polish",
      icon: <BrushCleaning className="size-4" />,
      onClick: ({ artifact, sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: `Polish the existing artifact${artifact.id !== "init" ? ` (id: ${artifact.id})` : ""}. Improve structure, grammar, readability, and make headings clearer. Use updateDocument, do not create a new artifact.`,
            },
          ],
        });
      },
    },
    {
      description: "Request suggestions",
      icon: <MessageSquareQuote className="size-4" />,
      onClick: ({ artifact, sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: `Add writing suggestions for the current artifact${artifact.id !== "init" ? ` (id: ${artifact.id})` : ""}. Use requestSuggestions on the existing artifact.`,
            },
          ],
        });
      },
    },
  ],
});

export const codeArtifactDefinition = new ArtifactDefinition({
  kind: "code",
  label: "Code",
  description: "Code artifact workspace with execution and iterative prompts.",
  mediaTypeLabel: "Script",
  icon: <Code2 className="size-4" />,
  preview: CodePreview,
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type !== "data-codeDelta") {
      return;
    }

    setArtifact((current) => ({
      ...current,
      content: String(streamPart.data ?? ""),
      isVisible: true,
      status: "streaming",
    }));
  },
  content: ({ content, currentVersionIndex, isCurrentVersion, onSaveContent, status }) => (
    <CodeEditor
      content={content}
      currentVersionIndex={currentVersionIndex}
      isCurrentVersion={isCurrentVersion}
      language="javascript"
      onSaveContent={onSaveContent}
      status={status}
      suggestions={[]}
    />
  ),
  actions: [
    {
      description: "Run code",
      icon: <Play className="size-4" />,
      label: "Run",
      onClick: ({ content, onExecuteCode }) => {
        onExecuteCode?.(content, "javascript");
      },
    },
    ...buildVersionActions(),
    {
      description: "Copy code",
      icon: <Copy className="size-4" />,
      onClick: ({ content }) => {
        copyToClipboard(content, "Copied code to clipboard");
      },
    },
  ],
  toolbar: [
    {
      description: "Add comments",
      icon: <MessageSquareQuote className="size-4" />,
      onClick: ({ artifact, sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: `Add concise comments to the existing code artifact${artifact.id !== "init" ? ` (id: ${artifact.id})` : ""}. Use updateDocument and keep behavior unchanged.`,
            },
          ],
        });
      },
    },
    {
      description: "Add logs",
      icon: <TerminalSquare className="size-4" />,
      onClick: ({ artifact, sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: `Add useful debug logs to the existing code artifact${artifact.id !== "init" ? ` (id: ${artifact.id})` : ""}. Use updateDocument and keep the current functionality.`,
            },
          ],
        });
      },
    },
  ],
});

export const sheetArtifactDefinition = new ArtifactDefinition({
  kind: "sheet",
  label: "Spreadsheet",
  description: "Spreadsheet artifact workspace for CSV-style content.",
  mediaTypeLabel: "Spreadsheet",
  icon: <Table2 className="size-4" />,
  preview: SheetPreview,
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type !== "data-sheetDelta") {
      return;
    }

    setArtifact((current) => ({
      ...current,
      content: String(streamPart.data ?? ""),
      isVisible: true,
      status: "streaming",
    }));
  },
  content: ({ content, currentVersionIndex, isCurrentVersion, onSaveContent, status }) => (
    <SheetEditor
      content={content}
      currentVersionIndex={currentVersionIndex}
      isCurrentVersion={isCurrentVersion}
      onSaveContent={onSaveContent}
      status={status}
    />
  ),
  actions: [
    ...buildVersionActions(),
    {
      description: "Copy CSV",
      icon: <Copy className="size-4" />,
      onClick: ({ content }) => {
        const parsed = parse<string[]>(content, { skipEmptyLines: true });
        const cleanedCsv = unparse(parsed.data.filter((row) => row.some((cell) => cell.trim() !== "")));
        copyToClipboard(cleanedCsv, "Copied CSV to clipboard");
      },
    },
  ],
  toolbar: [
    {
      description: "Format and clean data",
      icon: <BrushCleaning className="size-4" />,
      onClick: ({ artifact, sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: `Format and clean the existing spreadsheet artifact${artifact.id !== "init" ? ` (id: ${artifact.id})` : ""}. Use updateDocument and keep the data in CSV form.`,
            },
          ],
        });
      },
    },
    {
      description: "Analyze data",
      icon: <SquareChartGantt className="size-4" />,
      onClick: ({ artifact, sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: `Analyze the data in the current spreadsheet artifact${artifact.id !== "init" ? ` (id: ${artifact.id})` : ""}. If useful, create a code artifact for calculations or visualization.`,
            },
          ],
        });
      },
    },
  ],
});

export const artifactDefinitions = [
  textArtifactDefinition,
  codeArtifactDefinition,
  sheetArtifactDefinition,
] as const;

export const artifactDefinitionsByKind = artifactDefinitions.reduce(
  (acc, definition) => {
    acc[definition.kind] = definition;
    return acc;
  },
  {
    text: textArtifactDefinition,
    code: codeArtifactDefinition,
    sheet: sheetArtifactDefinition,
    diagram: textArtifactDefinition,
  } as Record<ArtifactState["kind"], (typeof artifactDefinitions)[number]>,
);

export function getArtifactDefinition(kind: ArtifactState["kind"]) {
  return artifactDefinitionsByKind[kind] ?? textArtifactDefinition;
}

export function applyArtifactStreamPart(args: {
  setArtifact: Dispatch<SetStateAction<ArtifactState>>;
  streamPart: { data?: unknown; type?: string };
}) {
  const streamType = args.streamPart.type;
  if (streamType === "data-textDelta") {
    return textArtifactDefinition.onStreamPart(args);
  }
  if (streamType === "data-codeDelta") {
    return codeArtifactDefinition.onStreamPart(args);
  }
  if (streamType === "data-sheetDelta") {
    return sheetArtifactDefinition.onStreamPart(args);
  }
}
