import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { normalizePaginationInput } from "@/lib/pagination";
import {
  getPaginatedKnowledgeDocuments,
  uploadKnowledgeDocument,
} from "@/lib/rag/service";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const document = await uploadKnowledgeDocument({
      actorId: session.user.id,
      contentType: file.type || "text/plain",
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
