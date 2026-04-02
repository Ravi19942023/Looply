import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/backend/lib";

import { CampaignListQuerySchema, CampaignSendSchema, CreateCampaignSchema } from "./campaign.schema";
import type { CampaignService } from "./campaign.service";

export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  async list(req: NextRequest): Promise<Response> {
    const parsed = CampaignListQuerySchema.safeParse({
      status: req.nextUrl.searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const campaigns = await this.campaignService.list(parsed.data.status);
    return successResponse(200, campaigns);
  }

  async create(req: NextRequest, actorId: string): Promise<Response> {
    const body = await req.json();
    const parsed = CreateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const campaign = await this.campaignService.create(parsed.data, actorId);
    return successResponse(201, campaign);
  }

  async getById(id: string): Promise<Response> {
    const campaign = await this.campaignService.getById(id);

    if (!campaign) {
      return errorResponse(404, "Campaign not found", "NOT_FOUND");
    }

    return successResponse(200, campaign);
  }

  async send(req: NextRequest, id: string, actorId: string): Promise<Response> {
    const body = await req.json().catch(() => ({}));
    const parsed = CampaignSendSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const campaign = await this.campaignService.send(id, actorId);
    return successResponse(200, campaign);
  }
}
