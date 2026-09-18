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

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { EmailVerificationTemplate } from "@/shared/infrastructure/resend/infrastructure/components/EmailVerificationTemplate";
import { SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";
import { redirect } from "next/navigation";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const resendCodeAction = async () => {
  const session = await auth();

  if (!session || !session.user.email) {
    redirect(SIGN_IN_ROUTE);
  }

  try {
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: session.user.email },
      orderBy: { expires: "desc" },
    });

    if (existingToken && existingToken.expires > new Date()) {
      return {
        success: false,
        message: "El código aún es válido. Por favor, revisa tu correo.",
      };
    }

    // Eliminar tokens antiguos del usuario
    await prisma.verificationToken.deleteMany({
      where: { identifier: session.user.email },
    });

    const token = generateCodeOTP();
    const expirationDate = getExpirationTime(TIME_EXPIRATION_MINUTES);

    await prisma.verificationToken.create({
      data: {
        identifier: session.user.email,
        token,
        expires: expirationDate,
      },
    });

    await resend.emails.send({
      from: fromEmail,
      to: [session.user.email],
      subject: "Reenvío de código de verificación",
      react: EmailVerificationTemplate({
        userName: session.user.name,
        verificationCode: token,
      }),
    });

    return { success: true, message: "Código reenviado correctamente." };
  } catch (error) {
    await logServerError({
      error,
      event: "auth.verification_code_resend.failed",
      feature: "auth",
      operation: "resend_verification_code",
      context: { userId: session.user.id },
    });
    return { success: false, message: "Error al reenviar el código." };
  }
};
