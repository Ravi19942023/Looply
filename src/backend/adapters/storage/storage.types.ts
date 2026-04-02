export interface UploadParams {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}

export interface DeleteUploadParams {
  key: string;
  url?: string;
}

export interface UploadResult {
  key: string;
  url: string;
}
