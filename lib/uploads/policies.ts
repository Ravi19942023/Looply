const MB_IN_BYTES = 1024 * 1024;

export const DEFAULT_UPLOAD_CONTENT_TYPE = "text/plain";
export const MARKDOWN_FILE_EXTENSION = ".md";

export const IMAGE_UPLOAD_CONTENT_TYPES = ["image/jpeg", "image/png"] as const;

export const SESSION_DOCUMENT_CONTENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const CHAT_MESSAGE_FILE_CONTENT_TYPES = [
  ...IMAGE_UPLOAD_CONTENT_TYPES,
  ...SESSION_DOCUMENT_CONTENT_TYPES,
] as const;

export const CHAT_IMAGE_UPLOAD_MAX_SIZE_BYTES = 5 * MB_IN_BYTES;

export function isImageUploadType(contentType: string) {
  return (IMAGE_UPLOAD_CONTENT_TYPES as readonly string[]).includes(
    contentType
  );
}

export function isSessionDocumentType(input: {
  name?: string | null;
  type: string;
}) {
  return (
    (SESSION_DOCUMENT_CONTENT_TYPES as readonly string[]).includes(
      input.type
    ) || input.name?.toLowerCase().endsWith(MARKDOWN_FILE_EXTENSION) === true
  );
}
