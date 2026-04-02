import { Document, SentenceSplitter } from "llamaindex";
import { embedTexts } from "@/backend/lib/ai-gateway";

import { INGESTION_CONFIG } from "./ingestion.constants";
import type { DocumentMetadata, IngestResult } from "./ingestion.types";
import { TextPreprocessor } from "./text-preprocessor";

interface ChunkRecord {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

import type { TelemetryService } from "@/backend/modules/telemetry";

export class IngestionService {
  private readonly splitter: SentenceSplitter;
  private readonly preprocessor: TextPreprocessor;

  constructor(private readonly telemetryService?: TelemetryService) {
    this.splitter = new SentenceSplitter({
      chunkSize: INGESTION_CONFIG.CHUNK_SIZE,
      chunkOverlap: INGESTION_CONFIG.CHUNK_OVERLAP,
    });

    this.preprocessor = new TextPreprocessor();
  }

  /**
   * Ingest raw extracted text into chunks with embeddings.
   *
   * Pipeline:
   * 1. Preprocess text (normalize, clean, strip artifacts)
   * 2. Create LlamaIndex Document with metadata
   * 3. Split into semantic chunks via SentenceSplitter
   * 4. Generate embeddings for each chunk
   * 5. Return chunk records ready for vector storage
   */
  async ingest(
    rawText: string,
    metadata: DocumentMetadata,
  ): Promise<{ chunks: ChunkRecord[]; result: IngestResult }> {
    const cleanText = this.preprocessor.process(rawText);

    if (!cleanText) {
      throw new Error("No readable text found after preprocessing.");
    }

    const doc = new Document({
      text: cleanText,
      metadata: {
        actorId: metadata.actorId,
        documentId: metadata.documentId,
        fileName: metadata.fileName,
        key: metadata.key,
        url: metadata.url,
      },
    });

    const nodes = this.splitter.getNodesFromDocuments([doc]);

    if (nodes.length === 0) {
      throw new Error("No chunks produced from document.");
    }

    const chunkTexts = nodes.map((node) => node.getText());
    const embeddings = await this.generateEmbeddings(chunkTexts, metadata.actorId);

    const chunks: ChunkRecord[] = nodes.map((node, index) => ({
      id: `${metadata.documentId}:${index}`,
      text: node.getText(),
      embedding: embeddings[index] ?? [],
      metadata: {
        actorId: metadata.actorId,
        documentId: metadata.documentId,
        fileName: metadata.fileName,
        key: metadata.key,
        url: metadata.url,
        chunkIndex: index,
        text: node.getText(),
      },
    }));

    return {
      chunks,
      result: { chunkCount: chunks.length },
    };
  }

  /**
   * Generate embeddings in batches.
   * OpenAI embedding API supports up to 2048 inputs per call,
   * but we batch at 100 to manage payload size.
   */
  private async generateEmbeddings(texts: string[], actorId?: string, chatId?: string): Promise<number[][]> {
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const { embeddings, usage } = await embedTexts(batch);
      allEmbeddings.push(...embeddings);

      if (usage && this.telemetryService && actorId) {
        this.telemetryService.logTokenUsage({
          actorId,
          chatId: chatId ?? null,
          source: "rag:embedTexts",
          model: INGESTION_CONFIG.EMBEDDING_MODEL,
          promptTokens: usage.tokens,
          completionTokens: 0,
          totalTokens: usage.tokens,
        }).catch(console.error);
      }
    }

    return allEmbeddings;
  }
}
