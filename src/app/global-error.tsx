"use client";

import { reportClientError } from "@/shared/infrastructure/logging/ClientErrorReporter";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="es">
      <body>
        <main style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Algo salió mal</h1>
          <p>El error fue registrado. Puedes intentar nuevamente.</p>
          <button onClick={reset} type="button">
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}

