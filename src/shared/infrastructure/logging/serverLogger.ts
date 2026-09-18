import "server-only";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import pino from "pino";

type LogValue = string | number | boolean | null | undefined;
type LogContext = Record<string, LogValue>;

const REDACTED = "[REDACTED]";
const LOG_LEVELS = new Set(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);
const configuredLogLevel = process.env.LOG_LEVEL;

const logger = pino({
  level:
    configuredLogLevel && LOG_LEVELS.has(configuredLogLevel)
      ? configuredLogLevel
      : process.env.NODE_ENV === "production"
        ? "info"
        : "debug",
  base: {
    service: process.env.LOG_SERVICE_NAME || "template-project-nextjs",
    environment: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      "password",
      "token",
      "authorization",
      "cookie",
      "secret",
      "apiKey",
      "accessToken",
      "refreshToken",
      "context.password",
      "context.token",
      "context.authorization",
      "context.cookie",
      "context.secret",
      "context.apiKey",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: REDACTED,
  },
});

export function getLogger(feature: string) {
  return logger.child({ feature });
}

export async function logServerError(options: {
  error: unknown;
  event: string;
  feature: string;
  operation: string;
  context?: LogContext;
  message?: string;
}) {
  const requestContext = await getRequestContext();

  getLogger(options.feature).error(
    {
      err: sanitizeError(options.error),
      event: options.event,
      operation: options.operation,
      ...requestContext,
      ...(options.context ? { context: options.context } : {}),
    },
    options.message || "Unexpected application error"
  );
}

export async function getRequestContext(): Promise<LogContext> {
  try {
    const requestHeaders = await headers();

    return {
      requestId:
        requestHeaders.get("x-request-id") ||
        requestHeaders.get("x-correlation-id") ||
        randomUUID(),
    };
  } catch {
    return { requestId: randomUUID() };
  }
}

export function sanitizeError(error: unknown): Error {
  if (error instanceof Error) {
    const sanitized = new Error(redactSensitiveText(error.message));
    sanitized.name = error.name;
    sanitized.stack = error.stack
      ? redactSensitiveText(error.stack)
      : sanitized.stack;
    return sanitized;
  }

  if (typeof error === "string") {
    return new Error(redactSensitiveText(error));
  }

  return new Error("A non-Error value was thrown", {
    cause: safeDescription(error),
  });
}

function redactSensitiveText(value: string) {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(/(password|token|secret|api[_-]?key|code)=([^&\s]+)/gi, "$1=[REDACTED]")
    .replace(
      /([a-z][a-z0-9+.-]*:\/\/)([^@\s/]+)@/gi,
      "$1[REDACTED]@"
    );
}

function safeDescription(value: unknown) {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  return Object.prototype.toString.call(value);
}
