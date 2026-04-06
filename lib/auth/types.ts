export type UserRole = "admin" | "manager" | "viewer";

export type AuthUser = {
  email: string;
  id: string;
  name: string | null;
  role: UserRole;
};

export type AuthSession = {
  user: AuthUser;
};

export type AccessTokenPayload = {
  email: string;
  exp: number;
  name: string | null;
  role: UserRole;
  sub: string;
  type: "access";
};

export type RefreshTokenPayload = {
  exp: number;
  sub: string;
  type: "refresh";
};
