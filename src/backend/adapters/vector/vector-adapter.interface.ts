import type { VectorQueryResult, VectorRecord } from "./vector.types";

export interface IVectorAdapter {
  readonly provider: string;
  upsert(records: VectorRecord[]): Promise<void>;
  query(namespace: string, values: number[], limit: number): Promise<VectorQueryResult[]>;
  queryLexical(namespace: string, query: string, limit: number): Promise<VectorQueryResult[]>;
  delete(namespace: string, ids: string[]): Promise<void>;
}
