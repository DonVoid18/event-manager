import "server-only";

import { auth } from "@/shared/infrastructure/libs/auth";

export class UnauthorizedError extends Error {
  constructor(message = "No tienes permisos para realizar esta acción") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireAdminSession() {
  const session = await auth();

  if (!session || !session.user.isActive) {
    throw new UnauthorizedError("Debes iniciar sesión para continuar");
  }

  if (session.user.role !== "ADMIN") {
    throw new UnauthorizedError("Solo un administrador puede realizar esta acción");
  }

  return session;
}

export async function requireActiveSession() {
  const session = await auth();

  if (!session || !session.user.isActive) {
    throw new UnauthorizedError("Debes iniciar sesión para continuar");
  }

  return session;
}
