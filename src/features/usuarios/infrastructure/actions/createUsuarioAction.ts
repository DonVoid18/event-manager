"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { passwordEncrypt } from "@/shared/infrastructure/libs/password";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireAdminSession, UnauthorizedError } from "@/shared/infrastructure/utils/authorization";
import { CreateUsuario, CreateUsuarioSchema } from "../../domain/validations/createUsuario";

export const createUsuarioAction = async (data: CreateUsuario) => {
  try {
    await requireAdminSession();
    const validatedData = CreateUsuarioSchema.parse(data);

    const existing = await prisma.user.findUnique({ where: { email: validatedData.email } });
    if (existing) {
      return { success: false, message: "Ya existe un usuario con este correo electrónico" };
    }

    const hashedPassword = await passwordEncrypt(validatedData.password);

    const usuario = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        emailVerified: new Date(),
      },
    });

    return {
      success: true,
      message: "Usuario creado correctamente",
      data: usuario,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, message: error.message };
    }
    await logServerError({
      error,
      event: "usuarios.create.failed",
      feature: "usuarios",
      operation: "create_usuario",
    });
    return {
      success: false,
      message: "No se pudo crear el usuario. Inténtalo nuevamente.",
    };
  }
};
