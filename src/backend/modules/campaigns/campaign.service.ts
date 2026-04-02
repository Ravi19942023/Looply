import type { EmailService } from "@/backend/modules/email/email.service";
import type { IAuditService } from "@/backend/modules/audit";
import { AUDIT_EVENTS } from "@/backend/modules/audit";
import type { ICustomerRepository } from "@/backend/modules/customers";

import { CAMPAIGN_STATUS } from "./campaign.constants";
import type { ICampaignRepository } from "./campaign.repository.interface";
import type { Campaign, CampaignDetails, CreateCampaignInput } from "./campaign.types";

export class CampaignService {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly emailService: EmailService,
    private readonly auditService: IAuditService,
  ) {}

  async list(status?: string): Promise<Campaign[]> {
    return this.campaignRepository.findAll(status);
  }

  async getById(id: string): Promise<CampaignDetails | null> {
    return this.campaignRepository.findById(id);
  }

  async create(input: CreateCampaignInput, actorId: string): Promise<Campaign> {
    let matchingRecipients: { name: string; email: string }[] = [];

    if (input.recipients && input.recipients.length > 0) {
      matchingRecipients = input.recipients;
    } else {
      const recipients = await this.customerRepository.findAll({ page: 1, pageSize: 500 }, undefined);
      matchingRecipients = recipients.items
        .filter((customer) => customer.segment === input.segment)
        .map((c) => ({ name: c.name, email: c.email }));
    }

    const status = input.scheduledAt ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.DRAFT;

    const campaign = await this.campaignRepository.create({
      ...input,
      createdBy: actorId,
      recipientCount: matchingRecipients.length,
      recipients: matchingRecipients,
      status,
    });

    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.CAMPAIGN_CREATED,
      resourceType: "campaign",
      resourceId: campaign.id,
      metadata: {
        recipientCount: matchingRecipients.length,
      },
    });

    return campaign;
  }

  async send(id: string, actorId: string): Promise<CampaignDetails> {
    const campaign = await this.campaignRepository.findById(id);

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    let matchingRecipients: { name: string; email: string }[] = [];

    if (campaign.recipients && campaign.recipients.length > 0) {
      matchingRecipients = campaign.recipients;
    } else {
      const recipients = await this.customerRepository.findAll({ page: 1, pageSize: 500 }, undefined);
      matchingRecipients = recipients.items
        .filter((customer) => customer.segment === campaign.segment)
        .map((c) => ({ name: c.name, email: c.email }));
    }

    const result = await this.emailService.send({
      to: matchingRecipients.map((customer) => customer.email),
      subject: campaign.subject,
      html: campaign.message,
    }, { campaignId: campaign.id });

    await this.campaignRepository.createLogs(
      matchingRecipients.map((recipient, index) => ({
        campaignId: campaign.id,
        email: recipient.email,
        status: result.success ? "sent" : "failed",
        messageId: result.messageIds[index] ?? null,
      })),
    );

    const updated = await this.campaignRepository.updateStatus(
      campaign.id,
      result.success ? CAMPAIGN_STATUS.SENT : CAMPAIGN_STATUS.FAILED,
      new Date(),
    );

    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.CAMPAIGN_SENT,
      resourceType: "campaign",
      resourceId: campaign.id,
      metadata: {
        recipientCount: matchingRecipients.length,
      },
    });

    return {
      ...(updated ?? campaign),
      logs: await this.campaignRepository.findById(campaign.id).then((details) => details?.logs ?? []),
    };
  }
}
