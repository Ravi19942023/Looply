import { NextResponse } from "next/server";

export const apiErrorMessages = {
  failedToProcessRequest: "Failed to process request",
  forbidden: "Forbidden",
  noFileUploaded: "No file uploaded",
  requestBodyEmpty: "Request body is empty",
  unauthorized: "Unauthorized",
  uploadFailed: "Upload failed",
} as const;

export function jsonErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
