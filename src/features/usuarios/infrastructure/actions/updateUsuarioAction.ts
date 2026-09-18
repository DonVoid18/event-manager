"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireAdminSession, UnauthorizedError } from "@/shared/infrastructure/utils/authorization";
import { UpdateUsuario, UpdateUsuarioSchema } from "../../domain/validations/updateUsuario";

export const updateUsuarioAction = async (id: string, data: UpdateUsuario) => {
  try {
    await requireAdminSession();
    const validatedData = UpdateUsuarioSchema.parse(data);

    const existing = await prisma.user.findFirst({
      where: { email: validatedData.email, NOT: { id } },
    });
    if (existing) {
      return { success: false, message: "Ya existe otro usuario con este correo electrónico" };
    }

    const usuario = await prisma.user.update({
      where: { id },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
      },
    });

    return {
      success: true,
      message: "Usuario actualizado correctamente",
      data: usuario,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, message: error.message };
    }
    await logServerError({
      error,
      event: "usuarios.update.failed",
      feature: "usuarios",
      operation: "update_usuario",
      context: { userId: id },
    });
    return {
      success: false,
      message: "No se pudo actualizar el usuario. Inténtalo nuevamente.",
    };
  }
};
