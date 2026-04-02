"use client";

import { exampleSetup } from "prosemirror-example-setup";
import { inputRules } from "prosemirror-inputrules";
import { EditorState } from "prosemirror-state";
import { tableEditing } from "prosemirror-tables";
import { type Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Suggestion } from "@/lib/db/schema";
import {
  documentSchema,
  handleTransaction,
  headingRule,
} from "@/lib/editor/config";
import {
  buildContentFromDocument,
  buildDocumentFromContent,
  createDecorations,
} from "@/lib/editor/functions";
import {
  projectWithPositions,
  suggestionsPlugin,
  suggestionsPluginKey,
  type UISuggestion,
} from "@/lib/editor/suggestions";
import { SuggestionDialog } from "./SuggestionDialog";

type EditorProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: "streaming" | "idle";
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  suggestions: Suggestion[];
  onSuggestionSelect?: (suggestion: UISuggestion | null) => void;
  onSuggestionApply?: () => void;
  activeSuggestion?: UISuggestion | null;
  readOnly?: boolean;
};

function PureEditor({
  content,
  onSaveContent,
  suggestions,
  status,
  readOnly = false,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const [activeSuggestionState, setActiveSuggestionState] = useState<UISuggestion | null>(
    null
  );
  const suggestionsRef = useRef<UISuggestion[]>([]);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const state = EditorState.create({
        doc: buildDocumentFromContent(content),
        plugins: [
          ...exampleSetup({ schema: documentSchema, menuBar: false }),
          inputRules({
            rules: [
              headingRule(1),
              headingRule(2),
              headingRule(3),
              headingRule(4),
              headingRule(5),
              headingRule(6),
            ],
          }),
          suggestionsPlugin,
          tableEditing(),
        ],
      });

      editorRef.current = new EditorView(containerRef.current, {
        state,
        editable: () => !readOnly,
        handleDOMEvents: {
          click(_view, event) {
            const target = event.target as HTMLElement;
            const highlight = target.closest(".suggestion-highlight");
            if (highlight) {
              const id = highlight.getAttribute("data-suggestion-id");
              const found = suggestionsRef.current.find((s) => s.id === id);
              if (found) {
                setActiveSuggestionState(found);
              }
              return true;
            }
            return false;
          },
        },
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setProps({
        editable: () => !readOnly,
        dispatchTransaction: (transaction) => {
          handleTransaction({
            transaction,
            editorRef,
            onSaveContent,
          });
        },
      });
    }
  }, [onSaveContent, readOnly]);

  useEffect(() => {
    if (editorRef.current && content) {
      const currentContent = buildContentFromDocument(
        editorRef.current.state.doc
      );

      if (status === "streaming") {
        const newDocument = buildDocumentFromContent(content);

        const transaction = editorRef.current.state.tr.replaceWith(
          0,
          editorRef.current.state.doc.content.size,
          newDocument.content
        );

        transaction.setMeta("no-save", true);
        editorRef.current.dispatch(transaction);
        return;
      }

      if (currentContent !== content) {
        const newDocument = buildDocumentFromContent(content);

        const transaction = editorRef.current.state.tr.replaceWith(
          0,
          editorRef.current.state.doc.content.size,
          newDocument.content
        );

        transaction.setMeta("no-save", true);
        editorRef.current.dispatch(transaction);
      }
    }
  }, [content, status]);

  useEffect(() => {
    if (editorRef.current?.state.doc && content) {
      const projectedSuggestions = projectWithPositions(
        editorRef.current.state.doc,
        suggestions
      ).filter(
        (suggestion) => suggestion.selectionStart && suggestion.selectionEnd
      );

      suggestionsRef.current = projectedSuggestions;

      const decorations = createDecorations(
        projectedSuggestions,
        editorRef.current
      );

      const transaction = editorRef.current.state.tr;
      transaction.setMeta(suggestionsPluginKey, { decorations });
      editorRef.current.dispatch(transaction);
    }
  }, [suggestions, content]);

  const handleApply = useCallback(() => {
    if (!editorRef.current || !activeSuggestionState) {
      return;
    }

    const { state, dispatch } = editorRef.current;
    const currentState = suggestionsPluginKey.getState(state);
    const currentDecorations = currentState?.decorations;

    if (currentDecorations) {
      const newDecorations = DecorationSet.create(
        state.doc,
        currentDecorations.find().filter((decoration: Decoration) => {
          return decoration.spec.suggestionId !== activeSuggestionState.id;
        })
      );

      const decorationTransaction = state.tr;
      decorationTransaction.setMeta(suggestionsPluginKey, {
        decorations: newDecorations,
        selected: null,
      });
      dispatch(decorationTransaction);
    }

    const textTransaction = editorRef.current.state.tr.replaceWith(
      activeSuggestionState.selectionStart,
      activeSuggestionState.selectionEnd,
      state.schema.text(activeSuggestionState.suggestedText)
    );
    textTransaction.setMeta("no-debounce", true);
    dispatch(textTransaction);

    setActiveSuggestionState(null);
  }, [activeSuggestionState]);

  return (
    <>
      <div
        className="prose dark:prose-invert prose-neutral relative max-w-none"
        ref={containerRef}
      />
      {activeSuggestionState &&
        containerRef.current?.closest("[data-slot='artifact-content']") &&
        createPortal(
          <SuggestionDialog
            onApply={handleApply}
            onClose={() => setActiveSuggestionState(null)}
            suggestion={activeSuggestionState}
          />,
          containerRef.current.closest(
            "[data-slot='artifact-content']"
          ) as HTMLElement
        )}
    </>
  );
}

function areEqual(prevProps: EditorProps, nextProps: EditorProps) {
  return (
    prevProps.suggestions === nextProps.suggestions &&
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === "streaming" && nextProps.status === "streaming") &&
    prevProps.content === nextProps.content &&
    prevProps.onSaveContent === nextProps.onSaveContent &&
    prevProps.readOnly === nextProps.readOnly
  );
}

export const TextEditor = memo(PureEditor, areEqual);
