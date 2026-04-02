"use client";

import { MarkdownSerializer, defaultMarkdownSerializer } from "prosemirror-markdown";
import { DOMParser, type Node } from "prosemirror-model";
import { Decoration, DecorationSet, type EditorView } from "prosemirror-view";
import { renderToString } from "react-dom/server";

import { MessageResponse } from "@/features/chat/components/ChatPanel/MessageResponse";

import { documentSchema } from "./config";
import type { UISuggestion } from "./suggestions";

export const buildDocumentFromContent = (content: string) => {
  const parser = DOMParser.fromSchema(documentSchema);
  const stringFromMarkdown = renderToString(
    <MessageResponse>{content}</MessageResponse>
  );
  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = stringFromMarkdown;
  return parser.parse(tempContainer);
};

const tableSerializer = (state: any, node: any) => {
  state.ensureNewLine();
  node.forEach((row: any, i: number) => {
    state.write("| ");
    row.forEach((cell: any, j: number) => {
      if (j > 0) state.write(" | ");
      state.renderContent(cell);
    });
    state.write(" |");
    state.ensureNewLine();
    if (i === 0) {
      state.write("|");
      row.forEach(() => state.write(" --- |"));
      state.ensureNewLine();
    }
  });
  state.closeBlock(node);
};

const customSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    table: tableSerializer,
    table_row: (state, node) => state.renderContent(node),
    table_cell: (state, node) => state.renderContent(node),
    table_header: (state, node) => state.renderContent(node),
  },
  defaultMarkdownSerializer.marks
);

export const buildContentFromDocument = (document: Node) => {
  return customSerializer.serialize(document);
};

export const createDecorations = (
  suggestions: UISuggestion[],
  _view: EditorView
) => {
  const decorations: Decoration[] = [];

  for (const suggestion of suggestions) {
    decorations.push(
      Decoration.inline(
        suggestion.selectionStart,
        suggestion.selectionEnd,
        {
          class: "suggestion-highlight",
          "data-suggestion-id": suggestion.id,
        },
        {
          suggestionId: suggestion.id,
          type: "highlight",
        }
      )
    );
  }

  return DecorationSet.create(_view.state.doc, decorations);
};
