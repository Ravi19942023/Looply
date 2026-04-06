import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { deleteChatDocument } from "@/lib/rag/service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteChatDocument({
      actorId: session.user.id,
      id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete chat file",
      },
      { status: 400 }
    );
  }
}
