import type { IVectorAdapter } from "./vector-adapter.interface";
import { PgVectorAdapter } from "./pgvector.adapter";

export class VectorAdapterFactory {
  static create(): IVectorAdapter {
    return new PgVectorAdapter();
  }
}
