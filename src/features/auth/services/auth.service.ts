import { API_ENDPOINTS } from "@/shared/constants";
import { apiClient } from "@/lib/api";

import type { AuthUser, LoginPayload } from "../types";

export async function login(payload: LoginPayload): Promise<AuthUser> {
  return apiClient<AuthUser>(API_ENDPOINTS.AUTH_LOGIN, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
