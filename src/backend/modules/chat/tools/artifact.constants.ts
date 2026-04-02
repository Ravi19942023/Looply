import { 
  codePromptTemplate, 
  sheetPromptTemplate,
  diagramPromptTemplate 
} from "@/backend/lib/prompts/artifact.prompt";
import type { ArtifactKind } from "@/lib/types";

export const ARTIFACT_CONFIGS: Record<ArtifactKind, { 
  deltaType: string; 
  createPrompt: string;
  mediaType: string;
}> = {
  text: { 
    deltaType: "data-textDelta", 
    createPrompt: "Write a polished markdown document with clear structure and helpful headings. If the data includes lists of items with multiple attributes (like customers, products, etc.), ALWAYS use well-formatted Markdown tables using standard pipes (|) and headers. Ensure there is a blank line before and after the table. Do NOT dump tabular data as plain text paragraphs or clumps of words.",
    mediaType: "document"
  },
  code: { 
    deltaType: "data-codeDelta", 
    createPrompt: `${codePromptTemplate}\n\nGenerate a complete implementation.`,
    mediaType: "script"
  },
  sheet: { 
    deltaType: "data-sheetDelta", 
    createPrompt: `${sheetPromptTemplate}\n\nGenerate realistic CSV content.`,
    mediaType: "spreadsheet"
  },
  diagram: {
    deltaType: "data-diagramDelta",
    createPrompt: `${diagramPromptTemplate}\n\nGenerate the layout correctly.`,
    mediaType: "diagram"
  },
};

export const STREAM_EVENTS = {
  KIND: "data-kind",
  ID: "data-id",
  TITLE: "data-title",
  CLEAR: "data-clear",
  FINISH: "data-finish",
  TEXT_DELTA: "data-textDelta",
  CODE_DELTA: "data-codeDelta",
  SHEET_DELTA: "data-sheetDelta",
  DIAGRAM_DELTA: "data-diagramDelta",
  SUGGESTION: "data-suggestion",
} as const;
