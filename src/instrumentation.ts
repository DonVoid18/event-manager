import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { getLogger, sanitizeError } = await import(
    "@/shared/infrastructure/logging/serverLogger"
  );

  getLogger("nextjs").error(
    {
      err: sanitizeError(error),
      event: "nextjs.request.unhandled_error",
      operation: context.routeType,
      requestId:
        request.headers["x-request-id"] ||
        request.headers["x-correlation-id"],
      method: request.method,
      path: request.path,
      routePath: context.routePath,
      routerKind: context.routerKind,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
    },
    "Unhandled Next.js request error"
  );
};
