"use server";

import {
  fromEmail,
  resend,
} from "@/shared/infrastructure/resend/infrastructure/utils/resend";
import {
  TIME_EXPIRATION_MINUTES,
  generateCodeOTP,
  getExpirationTime,
} from "@/shared/infrastructure/utils/generateCodeOTP";

import { PasswordResetTemplate } from "@/shared/infrastructure/resend/infrastructure/components/PasswordResetTemplate";
import { ForgotPassword } from "../../domain/validations/forgotPassword";
import { getPasswordResetIdentifier } from "../utils/passwordResetIdentifier";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const requestPasswordResetAction = async (data: ForgotPassword) => {
  try {
    const email = data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return {
        success: true,
        message: "Si el correo está registrado, recibirás un código.",
      };
    }

    const identifier = getPasswordResetIdentifier(email);

    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    const token = generateCodeOTP();
    const expirationDate = getExpirationTime(TIME_EXPIRATION_MINUTES);

    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires: expirationDate,
      },
    });

    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Código para recuperar contraseña",
      react: PasswordResetTemplate({
        userName: user.name,
        resetCode: token,
      }),
    });

    return {
      success: true,
      message: "Si el correo está registrado, recibirás un código.",
    };
  } catch (error) {
    await logServerError({
      error,
      event: "auth.password_reset_request.failed",
      feature: "auth",
      operation: "request_password_reset",
    });
    return {
      success: false,
      message: "Error al solicitar la recuperación de contraseña.",
    };
  }
};
