import { getLogger } from "@/shared/infrastructure/logging/serverLogger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const clientErrorSchema = z.object({
  event: z.enum([
    "browser.unhandled_error",
    "browser.unhandled_rejection",
    "browser.react_error_boundary",
  ]),
  message: z.string().max(1_000),
  stack: z.string().max(8_000).optional(),
  path: z.string().max(2_000),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) {
    return new NextResponse(null, { status: 413 });
  }

  try {
    const result = clientErrorSchema.safeParse(await request.json());
    if (!result.success) {
      return new NextResponse(null, { status: 400 });
    }

    getLogger("browser").error(
      {
        event: result.data.event,
        operation: "client_runtime",
        requestId:
          request.headers.get("x-request-id") ||
          request.headers.get("x-correlation-id") ||
          undefined,
        path: sanitizeClientText(result.data.path),
        clientError: {
          message: sanitizeClientText(result.data.message),
          stack: result.data.stack
            ? sanitizeClientText(result.data.stack)
            : undefined,
        },
      },
      "Client-side application error"
    );

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function sanitizeClientText(value: string) {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/(token|code|secret|password)=([^&\s]+)/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]");
}

