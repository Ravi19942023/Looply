import type { AnalyticsSummary } from "./analytics.types";

export interface ITransactionRepository {
  getSummary(days: number): Promise<AnalyticsSummary>;
}
