import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

import { SignJWT, jwtVerify } from "jose";

import { env } from "@/backend/config";

const encoder = new TextEncoder();

function getJwtSecret(): Uint8Array {
  return encoder.encode(env.AUTH_SECRET);
}

export async function signJwt(
  payload: Record<string, unknown>,
  expiresIn = env.JWT_EXPIRY,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

export async function verifyJwt<T extends Record<string, unknown>>(token: string): Promise<T> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as T;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 310_000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export async function comparePassword(password: string, storedValue: string): Promise<boolean> {
  const [salt, storedHash] = storedValue.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const computedHash = pbkdf2Sync(password, salt, 310_000, 32, "sha256");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (computedHash.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(computedHash, storedBuffer);
}

export function generateRandomPassword(length = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  const bytes = randomBytes(length);
  const result: string[] = [];

  for (let i = 0; i < length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      result.push(charset[byte % charset.length] ?? "x");
    }
  }

  return result.join("");
}
