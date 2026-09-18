"use server";

import {
  MAIN_ROUTE,
  SIGN_IN_ROUTE,
} from "@/shared/infrastructure/utils/routes";

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { redirect } from "next/navigation";
import { VerifyEmail } from "../../domain/validations/verifyEmail";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const verifyEmailAction = async (verifyEmail: VerifyEmail) => {
  const session = await auth();

  if (!session || !session.user.email) {
    redirect(SIGN_IN_ROUTE);
  }

  try {
    const tokenFound = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: session.user.email,
          token: verifyEmail.pin,
        },
      },
    });

    if (!tokenFound || tokenFound.expires < new Date()) {
      return { success: false, message: "Código inválido o expirado." };
    }

    // Actualizar el usuario como verificado
    await prisma.user.update({
      where: { id: session.user.id },
      data: { emailVerified: new Date() },
    });

    // Eliminar el token usado para evitar reutilización
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: session.user.email,
          token: verifyEmail.pin,
        },
      },
    });
  } catch (error) {
    await logServerError({
      error,
      event: "auth.email_verification.failed",
      feature: "auth",
      operation: "verify_email",
      context: { userId: session.user.id },
    });
    return { success: false, message: "Error al verificar el correo." };
  }

  redirect(MAIN_ROUTE);
};
