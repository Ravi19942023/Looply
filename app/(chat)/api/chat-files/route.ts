import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { apiErrorMessages, jsonErrorResponse } from "@/lib/http/api-errors";
import { listChatDocuments, uploadChatDocument } from "@/lib/rag/service";
import { DEFAULT_UPLOAD_CONTENT_TYPE } from "@/lib/uploads/policies";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return jsonErrorResponse(apiErrorMessages.unauthorized, 401);
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const files = await listChatDocuments({
    actorId: session.user.id,
    chatId,
  });

  return NextResponse.json(files);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return jsonErrorResponse(apiErrorMessages.unauthorized, 401);
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonErrorResponse(apiErrorMessages.noFileUploaded, 400);
  }

  try {
    const document = await uploadChatDocument({
      actorId: session.user.id,
      chatId,
      contentType: file.type || DEFAULT_UPLOAD_CONTENT_TYPE,
      file,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Chat file upload failed",
      },
      { status: 400 }
    );
  }
}
