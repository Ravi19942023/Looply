export interface VectorRecord {
  id: string;
  namespace: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorQueryResult {
  id: string;
  score: number;
  namespace?: string;
  metadata?: Record<string, unknown>;
  retrievalMode?: "semantic" | "lexical";
  lexical?: {
    exactFileNameMatch: boolean;
    exactTextMatch: boolean;
    tokenMatches: number;
    tokenCoverage: number;
  };
}
