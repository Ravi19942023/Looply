import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { canManageKnowledgeBase } from "@/lib/auth/permissions";
import {
  deleteKnowledgeDocument,
  toggleKnowledgeDocumentContext,
} from "@/lib/rag/service";

const toggleSchema = z.object({
  inContext: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageKnowledgeBase(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { inContext } = toggleSchema.parse(await request.json());
    const document = await toggleKnowledgeDocumentContext({
      actorId: session.user.id,
      id,
      inContext,
    });

    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update document",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageKnowledgeBase(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteKnowledgeDocument({
      actorId: session.user.id,
      id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete document",
      },
      { status: 400 }
    );
  }
}
