import { del, put } from "@vercel/blob";

import { env } from "@/backend/config";

import type { IStorageAdapter } from "./storage-adapter.interface";
import type { DeleteUploadParams, UploadParams, UploadResult } from "./storage.types";

export class BlobAdapter implements IStorageAdapter {
  readonly provider = "vercel-blob";

  async upload(params: UploadParams): Promise<UploadResult> {
    const body = Buffer.isBuffer(params.body) ? params.body : Buffer.from(params.body);
    const blob = await put(params.key, body, {
      access: "private",
      contentType: params.contentType,
      token: env.BLOB_READ_WRITE_TOKEN,
    });

    return {
      key: blob.pathname || params.key,
      url: blob.url,
    };
  }

  async delete(params: DeleteUploadParams): Promise<void> {
    if (!params.url) {
      throw new Error("Blob URL is required for delete operations.");
    }

    await del(params.url, {
      token: env.BLOB_READ_WRITE_TOKEN,
    });
  }
}
