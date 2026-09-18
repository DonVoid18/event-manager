"use client";

import { reportClientError } from "@/shared/infrastructure/logging/ClientErrorReporter";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, "browser.react_error_boundary");
  }, [error]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p className="max-w-md text-muted-foreground">
        El error fue registrado. Puedes intentar nuevamente.
      </p>
      <button
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        onClick={reset}
        type="button"
      >
        Reintentar
      </button>
    </main>
  );
}

