"use server";

import { passwordEncrypt } from "@/shared/infrastructure/libs/password";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";
import { redirect } from "next/navigation";
import {
  ResetPassword,
  ResetPasswordSchema,
} from "../../domain/validations/forgotPassword";
import { getPasswordResetIdentifier } from "../utils/passwordResetIdentifier";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const resetPasswordAction = async (data: ResetPassword) => {
  const validation = ResetPasswordSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      message: "Revisa los datos ingresados.",
    };
  }

  try {
    const email = validation.data.email.toLowerCase().trim();
    const identifier = getPasswordResetIdentifier(email);

    const tokenFound = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token: validation.data.pin,
        },
      },
    });

    if (!tokenFound || tokenFound.expires < new Date()) {
      return { success: false, message: "Código inválido o expirado." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return { success: false, message: "No se pudo actualizar la contraseña." };
    }

    const passwordEncrypted = await passwordEncrypt(validation.data.password);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordEncrypted },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });
  } catch (error) {
    await logServerError({
      error,
      event: "auth.password_reset.failed",
      feature: "auth",
      operation: "reset_password",
    });
    return { success: false, message: "Error al actualizar la contraseña." };
  }

  redirect(`${SIGN_IN_ROUTE}?passwordReset=success`);
};
