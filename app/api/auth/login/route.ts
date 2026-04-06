import { type NextRequest, NextResponse } from "next/server";
import {
  authenticateCredentials,
  authFormSchema,
} from "@/lib/auth/credentials";
import { setAuthCookies } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = authFormSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const result = await authenticateCredentials(parsed.data);

  if (!result) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ user: result.user }, { status: 200 });
  setAuthCookies(response.cookies, result.tokens);
  return response;
}
