"use client";

import { useEffect } from "react";

const MAX_MESSAGE_LENGTH = 1_000;
const MAX_STACK_LENGTH = 8_000;
const recentlyReported = new Map<string, number>();

export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError(event.error || event.message, "browser.unhandled_error");
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportClientError(event.reason, "browser.unhandled_rejection");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

export function reportClientError(error: unknown, event: string) {
  const normalized = normalizeClientError(error);
  const fingerprint = `${event}:${normalized.message}:${normalized.stack || ""}`;
  const now = Date.now();

  if (now - (recentlyReported.get(fingerprint) || 0) < 5_000) return;
  recentlyReported.set(fingerprint, now);

  const body = JSON.stringify({
    event,
    message: normalized.message,
    stack: normalized.stack,
    path: window.location.pathname,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/logs/client",
      new Blob([body], { type: "application/json" })
    );
    return;
  }

  void fetch("/api/logs/client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

function normalizeClientError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message.slice(0, MAX_MESSAGE_LENGTH),
      stack: error.stack?.slice(0, MAX_STACK_LENGTH),
    };
  }

  return {
    message:
      typeof error === "string"
        ? error.slice(0, MAX_MESSAGE_LENGTH)
        : "A non-Error value was thrown in the browser",
    stack: undefined,
  };
}
