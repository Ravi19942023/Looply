import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  listKnowledgeDocuments,
  uploadKnowledgeDocument,
} from "@/lib/rag/service";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await listKnowledgeDocuments(session.user.id);
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
