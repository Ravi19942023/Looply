import { and, desc, asc, eq, ilike, lte, gte, lt, gt, ne, inArray, isNull, isNotNull, or, sql } from "drizzle-orm";

import { buildPaginationMeta } from "@/backend/lib";
import { db } from "@/backend/db";
import { customerMetrics, customers } from "@/backend/db/schema";

import type { ICustomerRepository } from "./customer.repository.interface";
import type { Customer, CustomerWithMetrics, CustomerSearchOptions, FilterOperator } from "./customer.types";

export class CustomerRepository implements ICustomerRepository {
  private selectCustomerWithMetrics() {
    return {
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      segment: customers.segment,
      tags: customers.tags,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      totalRevenue: customerMetrics.totalRevenue,
      ltv: customerMetrics.ltv,
      orderCount: customerMetrics.orderCount,
      avgOrderValue: customerMetrics.avgOrderValue,
      lastPurchaseAt: customerMetrics.lastPurchaseAt,
      churnRiskScore: customerMetrics.churnRiskScore,
    };
  }

  async findAll(
    params: { page: number; pageSize: number },
    query?: string,
  ): Promise<{ items: CustomerWithMetrics[]; pagination: ReturnType<typeof buildPaginationMeta> }> {
    const offset = (params.page - 1) * params.pageSize;
    const whereClause = query
      ? or(ilike(customers.name, `%${query}%`), ilike(customers.email, `%${query}%`))
      : undefined;

    const [items, countResult] = await Promise.all([
      db
        .select(this.selectCustomerWithMetrics())
        .from(customers)
        .leftJoin(customerMetrics, eq(customers.id, customerMetrics.customerId))
        .where(whereClause)
        .limit(params.pageSize)
        .offset(offset)
        .orderBy(desc(customers.createdAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      items: items as CustomerWithMetrics[],
      pagination: buildPaginationMeta(params.page, params.pageSize, Number(total)),
    };
  }

  async findTopByRevenue(limit: number): Promise<CustomerWithMetrics[]> {
    return db
      .select(this.selectCustomerWithMetrics())
      .from(customers)
      .leftJoin(customerMetrics, eq(customers.id, customerMetrics.customerId))
      .orderBy(desc(customerMetrics.totalRevenue))
      .limit(limit);
  }

  async findChurnRisk(daysSinceLastPurchase: number): Promise<CustomerWithMetrics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastPurchase);

    return db
      .select(this.selectCustomerWithMetrics())
      .from(customers)
      .leftJoin(customerMetrics, eq(customers.id, customerMetrics.customerId))
      .where(
        and(
          lte(customerMetrics.lastPurchaseAt, cutoffDate),
          sql`${customerMetrics.customerId} is not null`,
        ),
      )
      .orderBy(desc(customerMetrics.churnRiskScore));
  }

  async getLtvById(id: string): Promise<CustomerWithMetrics | null> {
    const [result] = await db
      .select(this.selectCustomerWithMetrics())
      .from(customers)
      .innerJoin(customerMetrics, eq(customers.id, customerMetrics.customerId))
      .where(eq(customers.id, id))
      .limit(1);

    return result ?? null;
  }

  async search(options: CustomerSearchOptions): Promise<{ items: CustomerWithMetrics[]; pagination: any }> {
    const { 
      filters = [], 
      logic = "and", 
      page = 1, 
      pageSize = 10, 
      sortBy = "createdAt", 
      sortOrder = "desc" 
    } = options;
    
    const offset = (page - 1) * pageSize;
    
    const fieldMapping: Record<string, any> = {
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      segment: customers.segment,
      totalRevenue: customerMetrics.totalRevenue,
      ltv: customerMetrics.ltv,
      orderCount: customerMetrics.orderCount,
      avgOrderValue: customerMetrics.avgOrderValue,
      churnRiskScore: customerMetrics.churnRiskScore,
      lastPurchaseAt: customerMetrics.lastPurchaseAt,
      createdAt: customers.createdAt,
    };

    const buildFilter = (filter: any) => {
      const field = fieldMapping[filter.field];
      if (!field) return undefined;

      switch (filter.operator) {
        case "eq": return eq(field, filter.value);
        case "neq": return ne(field, filter.value);
        case "contains": return ilike(field, `%${filter.value}%`);
        case "gt": return gt(field, filter.value);
        case "lt": return lt(field, filter.value);
        case "gte": return gte(field, filter.value);
        case "lte": return lte(field, filter.value);
        case "in": return inArray(field, Array.isArray(filter.value) ? filter.value : [filter.value]);
        case "is_null": return isNull(field);
        case "is_not_null": return isNotNull(field);
        default: return undefined;
      }
    };

    const drizzleFilters = filters.map(buildFilter).filter(Boolean);
    const complexWhere = drizzleFilters.length > 0 
      ? (logic === "or" ? or(...drizzleFilters) : and(...drizzleFilters))
      : undefined;

    const sortField = fieldMapping[sortBy] || customers.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [items, countResult] = await Promise.all([
      db
        .select(this.selectCustomerWithMetrics())
        .from(customers)
        .leftJoin(customerMetrics, eq(customers.id, customerMetrics.customerId))
        .where(complexWhere)
        .limit(pageSize)
        .offset(offset)
        .orderBy(orderFn(sortField)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .leftJoin(customerMetrics, eq(customers.id, customerMetrics.customerId))
        .where(complexWhere),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      items: items as CustomerWithMetrics[],
      pagination: buildPaginationMeta(page, pageSize, Number(total)),
    };
  }
}
