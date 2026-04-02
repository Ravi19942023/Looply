import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/backend/lib";

import {
  ChurnCustomersQuerySchema,
  CustomerIdParamSchema,
  CustomerListQuerySchema,
  TopCustomersQuerySchema,
} from "./customer.schema";
import type { CustomerService } from "./customer.service";

export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  async list(req: NextRequest, actorId: string): Promise<Response> {
    const parsed = CustomerListQuerySchema.safeParse({
      page: req.nextUrl.searchParams.get("page"),
      pageSize: req.nextUrl.searchParams.get("pageSize"),
      query: req.nextUrl.searchParams.get("query") ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const result = await this.customerService.list(
      { page: parsed.data.page, pageSize: parsed.data.pageSize },
      actorId,
      parsed.data.query,
    );

    return successResponse(200, result.items, { pagination: result.pagination });
  }

  async top(req: NextRequest, actorId: string): Promise<Response> {
    const parsed = TopCustomersQuerySchema.safeParse({
      limit: req.nextUrl.searchParams.get("limit"),
    });

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const result = await this.customerService.getTopCustomers(parsed.data.limit, actorId);
    return successResponse(200, result);
  }

  async churn(req: NextRequest, actorId: string): Promise<Response> {
    const parsed = ChurnCustomersQuerySchema.safeParse({
      daysSinceLastPurchase: req.nextUrl.searchParams.get("daysSinceLastPurchase"),
    });

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const result = await this.customerService.getChurnRiskCustomers(
      actorId,
      parsed.data.daysSinceLastPurchase,
    );

    return successResponse(200, result);
  }

  async ltv(id: string, actorId: string): Promise<Response> {
    const parsed = CustomerIdParamSchema.safeParse({ id });

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const result = await this.customerService.getCustomerLtv(parsed.data.id, actorId);

    if (!result) {
      return errorResponse(404, "Customer not found", "NOT_FOUND");
    }

    return successResponse(200, result);
  }
}
