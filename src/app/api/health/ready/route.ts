import { access, constants } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { getLogger } from "@/shared/infrastructure/logging/serverLogger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let pending: Promise<void> | undefined;
let failedUntil = 0;

async function check() {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL statement_timeout = '3000ms'`;
    await tx.$queryRaw`SELECT 1`;
    // Verifica el esquema esencial sin leer datos de usuarios.
    await tx.$queryRaw`SELECT id FROM products LIMIT 0`;
  }, { maxWait: 3000, timeout: 7000 });
  await access(path.join(process.cwd(), "private"), constants.R_OK | constants.W_OK);
}

export async function GET() {
  try {
    if (Date.now() < failedUntil) throw new Error("Unavailable");
    // Agrupa sondeos simultáneos sin guardar un resultado sano obsoleto.
    pending ??= check().finally(() => { pending = undefined; });
    await pending;
    return Response.json({ status: "ok" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    if (Date.now() >= failedUntil) {
      getLogger("health").error({
        event: "health.readiness.failed", operation: "readiness",
      }, "La aplicación no está disponible");
    }
    failedUntil = Date.now() + 2000;
    return Response.json({ status: "unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
