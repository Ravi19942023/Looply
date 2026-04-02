import type { DeleteUploadParams, UploadParams, UploadResult } from "./storage.types";

export interface IStorageAdapter {
  readonly provider: string;
  upload(params: UploadParams): Promise<UploadResult>;
  delete(params: DeleteUploadParams): Promise<void>;
}
