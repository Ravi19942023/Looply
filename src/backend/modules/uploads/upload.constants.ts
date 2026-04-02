export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
export const SESSION_MAX_UPLOAD_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

