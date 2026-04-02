import { describe, expect, it, vi } from "vitest";

import { buildAllTools } from "./index";

interface ExecutableTool {
  execute(input: Record<string, unknown>): Promise<unknown>;
}

function createMockServices() {
  return {
    customerService: {
      getTopCustomers: vi.fn().mockResolvedValue([]),
      getChurnRiskCustomers: vi.fn().mockResolvedValue([]),
    },
    campaignService: {
      list: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(null),
    },
    analyticsService: {
      getSummary: vi.fn().mockResolvedValue({}),
    },
    ragService: {
      retrieveContextForQuery: vi.fn().mockResolvedValue([]),
    },
    memoryService: {
      getMemory: vi.fn().mockResolvedValue(null),
      updateLongTermMemory: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("chat tools", () => {
  it("delegates customer and analytics tools with the actor scope", async () => {
    const services = createMockServices();

    const tools = buildAllTools(services as never, "actor-1");

    await (tools.getTopCustomers as unknown as ExecutableTool).execute({ limit: 3 });
    await (tools.getAnalyticsSummary as unknown as ExecutableTool).execute({ period: "30d" });

    expect(services.customerService.getTopCustomers).toHaveBeenCalledWith(3, "actor-1");
    expect(services.analyticsService.getSummary).toHaveBeenCalledWith("actor-1", "30d");
  });

  it("delegates campaign and rag tools through services only", async () => {
    const services = createMockServices();
    services.campaignService.getById.mockResolvedValue({ id: "campaign-1" });

    const tools = buildAllTools(services as never, "actor-2");

    await (tools.listCampaigns as unknown as ExecutableTool).execute({});
    await (tools.getCampaignById as unknown as ExecutableTool).execute({ id: "campaign-1" });
    await (tools.retrieveKnowledgeContext as unknown as ExecutableTool).execute({
      query: "pricing",
      limit: 2,
    });

    expect(services.campaignService.list).toHaveBeenCalledWith(undefined);
    expect(services.campaignService.getById).toHaveBeenCalledWith("campaign-1");
    expect(services.ragService.retrieveContextForQuery).toHaveBeenCalledWith("actor-2", "pricing", { limit: 2 });
  });

  it("delegates memory tools with the actor scope", async () => {
    const services = createMockServices();

    const tools = buildAllTools(services as never, "actor-3");

    await (tools.storeUserPreference as unknown as ExecutableTool).execute({
      field: "preferredTone",
      value: "casual",
    });
    await (tools.recallUserContext as unknown as ExecutableTool).execute({});

    expect(services.memoryService.updateLongTermMemory).toHaveBeenCalledWith("actor-3", "preferredTone", "casual");
    expect(services.memoryService.getMemory).toHaveBeenCalledWith("actor-3");
  });
});
