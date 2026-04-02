import type { AnalyticsService } from "@/backend/modules/analytics";
import type { CampaignService } from "@/backend/modules/campaigns";
import type { CustomerService } from "@/backend/modules/customers";
import type { MemoryService } from "@/backend/modules/memory";
import type { RagService } from "@/backend/modules/rag";

import { buildArtifactTools } from "./artifact.tools";
import { buildAnalyticsTools } from "./analytics.tools";
import { buildCampaignTools } from "./campaign.tools";
import { buildCustomerTools } from "./customer.tools";
import { buildMemoryTools } from "./memory.tools";
import { buildRagTools } from "./rag.tools";

export interface ChatToolServices {
  analyticsService: AnalyticsService;
  campaignService: CampaignService;
  customerService: CustomerService;
  memoryService: MemoryService;
  ragService: RagService;
}

export function buildAllTools(
  services: ChatToolServices,
  actorId: string,
  chatId?: string,
  dataStream?: any,
) {
  const tools = {
    ...buildCustomerTools(services.customerService, actorId),
    ...buildCampaignTools(services.campaignService, actorId),
    ...buildAnalyticsTools(services.analyticsService, actorId),
    ...buildRagTools(services.ragService, actorId, chatId),
    ...buildMemoryTools(services.memoryService, actorId),
  };

  if (chatId && dataStream) {
    Object.assign(
      tools,
      buildArtifactTools({
        actorId,
        chatId,
        dataStream,
      }),
    );
  }

  return tools;
}

export { buildArtifactTools } from "./artifact.tools";

export { buildAnalyticsTools } from "./analytics.tools";
export { buildCampaignTools } from "./campaign.tools";
export { buildCustomerTools } from "./customer.tools";
export { buildMemoryTools } from "./memory.tools";
export { buildRagTools } from "./rag.tools";
