import { eq } from "drizzle-orm";

import { db } from "@/backend/db";
import { users } from "@/backend/db/schema";

import type { IUserRepository, UserRecord } from "./user.repository.interface";

export class UserRepository implements IUserRepository {
  private mapUserRecord(result: {
    id: string;
    name: string;
    email: string;
    role: string;
    passwordHash: string;
  }): UserRecord {
    return {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role as UserRecord["role"],
      passwordHash: result.passwordHash,
    };
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!result) {
      return null;
    }

    return this.mapUserRecord(result);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!result) {
      return null;
    }

    return this.mapUserRecord(result);
  }

  async findAll(): Promise<UserRecord[]> {
    const result = await db.query.users.findMany({
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    });

    return result.map((user) => this.mapUserRecord(user));
  }

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRecord["role"];
  }): Promise<UserRecord> {
    const [result] = await db.insert(users).values(input).returning();
    if (!result) {
      throw new Error("Failed to create user.");
    }
    return this.mapUserRecord(result);
  }

  async updateProfile(
    id: string,
    input: {
      name?: string;
      passwordHash?: string;
    },
  ): Promise<UserRecord | null> {
    const [result] = await db
      .update(users)
      .set({
        ...(input.name ? { name: input.name } : {}),
        ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
      })
      .where(eq(users.id, id))
      .returning();

    return result ? this.mapUserRecord(result) : null;
  }

  async updateRole(id: string, role: UserRecord["role"]): Promise<UserRecord | null> {
    const [result] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();

    return result ? this.mapUserRecord(result) : null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}
