"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireAdminSession, UnauthorizedError } from "@/shared/infrastructure/utils/authorization";

export const toggleUsuarioActivoAction = async (id: string, isActive: boolean) => {
  try {
    const session = await requireAdminSession();

    if (session.user.id === id && !isActive) {
      return { success: false, message: "No puedes desactivar tu propia cuenta" };
    }

    const usuario = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    if (!isActive) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    return {
      success: true,
      message: isActive ? "Usuario activado correctamente" : "Usuario desactivado correctamente",
      data: usuario,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, message: error.message };
    }
    await logServerError({
      error,
      event: "usuarios.toggle_active.failed",
      feature: "usuarios",
      operation: "toggle_usuario_activo",
      context: { userId: id },
    });
    return {
      success: false,
      message: "No se pudo actualizar el estado del usuario.",
    };
  }
};
