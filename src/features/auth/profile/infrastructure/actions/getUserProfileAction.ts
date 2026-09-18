"use server";

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const getUserProfileAction = async () => {
  const session = await auth();
  if (!session || !session.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        password: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        image: user.image || "",
        hasPassword: !!user.password,
        emailVerified: user.emailVerified,
        verificationEmailActive: process.env.VERIFICATION_EMAIL_ACTIVE === "true",
      },
    };
  } catch (error) {
    await logServerError({
      error,
      event: "auth.profile_read.failed",
      feature: "auth",
      operation: "get_user_profile",
      context: { userId: session.user.id },
    });
    return {
      success: false,
      error: "No se pudo obtener el perfil. Inténtalo nuevamente.",
    };
  }
};
