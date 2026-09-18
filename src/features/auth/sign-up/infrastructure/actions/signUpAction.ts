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

import { signIn } from "@/shared/infrastructure/libs/auth";
import { passwordEncrypt } from "@/shared/infrastructure/libs/password";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { EmailVerificationTemplate } from "@/shared/infrastructure/resend/infrastructure/components/EmailVerificationTemplate";
import { EMAIL_VERIFICATION_ROUTE } from "@/shared/infrastructure/utils/routes";
import { redirect } from "next/navigation";
import { SignUp } from "../../domain/validations/signUp";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const signUpAction = async (user: SignUp) => {
  try {
    const { email, password, name } = user;

    const existingUserName = await prisma.user.findFirst({
      where: { name },
    });

    if (existingUserName) {
      return {
        success: false,
        message: "El nombre de usuario ya está registrado",
      };
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return {
        success: false,
        message: "El correo electrónico ya está registrado",
      };
    }

    const verificationEmailActive =
      process.env.VERIFICATION_EMAIL_ACTIVE === "true";

    const passwordEncrypted = await passwordEncrypt(password);

    await prisma.user.create({
      data: {
        email,
        password: passwordEncrypted,
        name,
        emailVerified: verificationEmailActive ? null : new Date(),
      },
    });

    // Optional: Send verification email
    if (verificationEmailActive) {
      const token = generateCodeOTP();
      const expirationDate = getExpirationTime(TIME_EXPIRATION_MINUTES);

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: expirationDate,
        },
      });

      await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: "Código de verificación",
        react: EmailVerificationTemplate({
          userName: name,
          verificationCode: token,
        }),
      });
    }

    // Sign in the user automatically
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    await logServerError({
      error,
      event: "auth.sign_up.failed",
      feature: "auth",
      operation: "sign_up",
    });
    return {
      success: false,
      message: "Error al registrar el usuario",
    };
  }

  // Redirect to email verification
  redirect(EMAIL_VERIFICATION_ROUTE);
};
