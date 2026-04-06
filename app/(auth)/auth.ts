import { cookies } from "next/headers";
import {
  clearAuthCookies,
  getCurrentSessionFromCookies,
} from "@/lib/auth/server";

export type UserType = "admin" | "manager" | "viewer";

export async function auth() {
  const cookieStore = await cookies();
  return getCurrentSessionFromCookies(cookieStore);
}

export async function signOut() {
  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);
}
