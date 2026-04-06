export type AuthUser = {
  email: string;
  id: string;
  name: string | null;
  type: "regular";
};

export type AuthSession = {
  user: AuthUser;
};

export type AccessTokenPayload = {
  email: string;
  exp: number;
  name: string | null;
  sub: string;
  type: "access";
};

export type RefreshTokenPayload = {
  exp: number;
  sub: string;
  type: "refresh";
};
