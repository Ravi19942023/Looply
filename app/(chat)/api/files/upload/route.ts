import { put } from "@vercel/blob";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { apiErrorMessages, jsonErrorResponse } from "@/lib/http/api-errors";
import {
  CHAT_IMAGE_UPLOAD_MAX_SIZE_BYTES,
  isImageUploadType,
} from "@/lib/uploads/policies";

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= CHAT_IMAGE_UPLOAD_MAX_SIZE_BYTES, {
      message: "File size should be less than 5MB",
    })
    .refine((file) => isImageUploadType(file.type), {
      message: "File type should be JPEG or PNG",
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return jsonErrorResponse(apiErrorMessages.unauthorized, 401);
  }

  if (request.body === null) {
    return jsonErrorResponse(apiErrorMessages.requestBodyEmpty, 400);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return jsonErrorResponse(apiErrorMessages.noFileUploaded, 400);
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return jsonErrorResponse(errorMessage, 400);
    }

    const filename = (formData.get("file") as File).name;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`${safeName}`, fileBuffer, {
        access: "private",
        contentType: file.type,
        addRandomSuffix: false,
      });

      return Response.json({
        url: data.downloadUrl,
        pathname: data.pathname,
        contentType: data.contentType,
        storageUrl: data.url,
      });
    } catch (_error) {
      return jsonErrorResponse(apiErrorMessages.uploadFailed, 500);
    }
  } catch (_error) {
    return jsonErrorResponse(apiErrorMessages.failedToProcessRequest, 500);
  }
}
