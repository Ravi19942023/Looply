import { auth } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";
import { sendCampaignDraft } from "@/lib/looply/services";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const body = (await request.json().catch(() => null)) as {
    campaignId?: string;
  } | null;

  if (!body?.campaignId) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const result = await sendCampaignDraft(body.campaignId, true);

  if ("error" in result) {
    return Response.json(result, { status: 404 });
  }

  return Response.json(result, { status: 200 });
}
