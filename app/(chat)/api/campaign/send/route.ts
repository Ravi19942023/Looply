import { auth } from "@/app/(auth)/auth";
import { canSendCampaign } from "@/lib/auth/permissions";
import { ChatbotError } from "@/lib/errors";
import { sendCampaignDraft } from "@/lib/looply/services";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  if (!canSendCampaign(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    campaignId?: string;
  } | null;

  if (!body?.campaignId) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const result = await sendCampaignDraft(
    body.campaignId,
    true,
    session.user.id
  );

  if ("error" in result) {
    const status = result.error === "Campaign not found." ? 404 : 400;
    return Response.json(result, { status });
  }

  return Response.json(result, { status: 200 });
}
