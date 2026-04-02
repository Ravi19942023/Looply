import type { IStorageAdapter } from "./storage-adapter.interface";
import { BlobAdapter } from "./blob.adapter";

export class StorageAdapterFactory {
  static create(): IStorageAdapter {
    return new BlobAdapter();
  }
}
