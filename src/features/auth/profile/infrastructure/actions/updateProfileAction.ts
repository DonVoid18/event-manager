"use server";

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { passwordEncrypt, passwordIsValid } from "@/shared/infrastructure/libs/password";
import { Prisma } from "@prisma/client";
import { UpdateProfile, UpdateProfileSchema } from "../../domain/validations/profileSchema";
import {
  fromEmail,
  resend,
} from "@/shared/infrastructure/resend/infrastructure/utils/resend";
import {
  TIME_EXPIRATION_MINUTES,
  generateCodeOTP,
  getExpirationTime,
} from "@/shared/infrastructure/utils/generateCodeOTP";
import { EmailVerificationTemplate } from "@/shared/infrastructure/resend/infrastructure/components/EmailVerificationTemplate";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const updateProfileAction = async (data: UpdateProfile) => {
  const session = await auth();
  if (!session || !session.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  try {
    // 1. Validar el esquema mediante Zod
    const validatedData = UpdateProfileSchema.parse(data);

    // 2. Obtener el usuario actual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const updateData: Prisma.UserUpdateInput = {};

    // 3. Validar y actualizar Nombre
    if (validatedData.name !== user.name) {
      const existingName = await prisma.user.findFirst({
        where: {
          name: validatedData.name,
          NOT: { id: user.id },
        },
      });
      if (existingName) {
        return { success: false, error: "El nombre de usuario ya está registrado" };
      }
      updateData.name = validatedData.name;
    }

    // 4. Validar y actualizar Email (si cambia)
    let emailChanged = false;
    if (validatedData.email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      if (existingEmail) {
        return { success: false, error: "El correo electrónico ya está registrado" };
      }
      updateData.email = validatedData.email;
      emailChanged = true;
    }

    // 5. Actualizar imagen/avatar
    if (validatedData.image !== user.image) {
      updateData.image = validatedData.image || null;
    }

    // 6. Validar y actualizar Contraseña
    if (validatedData.newPassword) {
      if (user.password) {
        // El usuario ya tiene contraseña (registro por credenciales), se valida la contraseña actual
        if (!validatedData.currentPassword) {
          return { success: false, error: "Debe ingresar su contraseña actual para cambiarla" };
        }
        const isValid = await passwordIsValid(validatedData.currentPassword, user.password);
        if (!isValid) {
          return { success: false, error: "La contraseña actual es incorrecta" };
        }
      }
      // Cifrar la nueva contraseña
      updateData.password = await passwordEncrypt(validatedData.newPassword);
    }

    // 7. Manejar verificación de correo si este cambió
    const verificationEmailActive = process.env.VERIFICATION_EMAIL_ACTIVE === "true";
    if (emailChanged) {
      if (verificationEmailActive) {
        updateData.emailVerified = null;

        // Generar token OTP y expirar anteriores para este email
        const token = generateCodeOTP();
        const expirationDate = getExpirationTime(TIME_EXPIRATION_MINUTES);

        // Limpiar tokens anteriores para evitar duplicados en base a este email
        await prisma.verificationToken.deleteMany({
          where: { identifier: validatedData.email },
        });

        await prisma.verificationToken.create({
          data: {
            identifier: validatedData.email,
            token,
            expires: expirationDate,
          },
        });

        // Enviar correo de verificación
        await resend.emails.send({
          from: fromEmail,
          to: [validatedData.email],
          subject: "Código de verificación",
          react: EmailVerificationTemplate({
            userName: validatedData.name || user.name || "Usuario",
            verificationCode: token,
          }),
        });
      } else {
        // Si no está activa la verificación, se marca como verificado directamente
        updateData.emailVerified = new Date();
      }
    }

    // 8. Realizar la actualización en la BD
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return {
      success: true,
      message: "Perfil actualizado correctamente",
      emailChanged: emailChanged && verificationEmailActive,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      },
    };
  } catch (error) {
    await logServerError({
      error,
      event: "auth.profile_update.failed",
      feature: "auth",
      operation: "update_profile",
      context: { userId: session.user.id },
    });
    return {
      success: false,
      error: "No se pudo actualizar el perfil. Inténtalo nuevamente.",
    };
  }
};
