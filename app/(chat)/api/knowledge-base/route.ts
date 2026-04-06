import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { canManageKnowledgeBase } from "@/lib/auth/permissions";
import { apiErrorMessages, jsonErrorResponse } from "@/lib/http/api-errors";
import { normalizePaginationInput } from "@/lib/pagination";
import {
  getPaginatedKnowledgeDocuments,
  uploadKnowledgeDocument,
} from "@/lib/rag/service";
import { DEFAULT_UPLOAD_CONTENT_TYPE } from "@/lib/uploads/policies";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return jsonErrorResponse(apiErrorMessages.unauthorized, 401);
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const paginationInput = normalizePaginationInput({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  });

  const documents = await getPaginatedKnowledgeDocuments({
    actorId: session.user.id,
    page: paginationInput.page,
    pageSize: paginationInput.pageSize,
    q,
  });

  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return jsonErrorResponse(apiErrorMessages.unauthorized, 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonErrorResponse(apiErrorMessages.noFileUploaded, 400);
  }

  if (!canManageKnowledgeBase(session.user.role)) {
    return jsonErrorResponse(apiErrorMessages.forbidden, 403);
  }

  try {
    const document = await uploadKnowledgeDocument({
      actorId: session.user.id,
      contentType: file.type || DEFAULT_UPLOAD_CONTENT_TYPE,
      file,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Knowledge upload failed",
      },
      { status: 400 }
    );
  }
}
