import type { NextRequest } from "next/server";
import { withAuth, withErrorBoundary, withRequestLog } from "@/backend/middleware";
import { executeJavaScript } from "@/backend/lib/executor";
import { ChatbotError } from "@/lib/errors";

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () =>
    withRequestLog(req, async () =>
      withAuth(req, async () => {
        const { code, language } = await req.json().catch(() => ({}));

        if (!code) {
           return new ChatbotError("bad_request:api", "No code provided.").toResponse();
        }

        if (language && !["javascript", "typescript", "js", "ts"].includes(language.toLowerCase())) {
           return new ChatbotError("bad_request:api", `Execution for '${language}' is not supported yet in POC. Please use JavaScript/TypeScript.`).toResponse();
        }

        const result = await executeJavaScript(code);

        return Response.json(result);
      }),
    ),
  );
}
