import type { AuthUser } from "./auth.types";

export interface UserRecord extends AuthUser {
  passwordHash: string;
}

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findAll(): Promise<UserRecord[]>;
  create(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRecord["role"];
  }): Promise<UserRecord>;
  updateProfile(
    id: string,
    input: {
      name?: string;
      passwordHash?: string;
    },
  ): Promise<UserRecord | null>;
  updateRole(id: string, role: UserRecord["role"]): Promise<UserRecord | null>;
  delete(id: string): Promise<void>;
}
