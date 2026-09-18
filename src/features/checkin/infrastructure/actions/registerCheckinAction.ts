"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";

export const registerCheckinAction = async (attendeeId: string) => {
  try {
    await requireActiveSession();

    const attendee = await prisma.attendee.findUnique({
      where: { id: attendeeId },
      include: { checkIn: true, invitation: true },
    });

    if (!attendee) {
      return { success: false, message: "El asistente no fue encontrado en este evento" };
    }

    if (attendee.checkIn) {
      return {
        success: false,
        duplicate: true,
        message: `Ya se registró el ingreso de ${attendee.firstName} ${attendee.lastName}. No se permiten ingresos duplicados.`,
      };
    }

    const checkIn = await prisma.checkIn.create({ data: { attendeeId } });

    if (attendee.invitation && attendee.invitation.status !== "CONFIRMADA") {
      await prisma.invitation.update({
        where: { id: attendee.invitation.id },
        data: { status: "CONFIRMADA" },
      });
      await prisma.invitationStatusHistory.create({
        data: { invitationId: attendee.invitation.id, status: "CONFIRMADA" },
      });
    }

    return {
      success: true,
      message: `Check-in registrado correctamente para ${attendee.firstName} ${attendee.lastName}`,
      data: checkIn,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        duplicate: true,
        message: "Ya se registró el ingreso de este asistente. No se permiten ingresos duplicados.",
      };
    }

    await logServerError({
      error,
      event: "checkin.register.failed",
      feature: "checkin",
      operation: "register_checkin",
      context: { attendeeId },
    });
    return {
      success: false,
      message: "No se pudo registrar el check-in. Inténtalo nuevamente.",
    };
  }
};
