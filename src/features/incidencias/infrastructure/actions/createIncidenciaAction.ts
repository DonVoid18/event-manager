"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";
import { CreateIncidencia, CreateIncidenciaSchema } from "../../domain/validations/createIncidencia";

export const createIncidenciaAction = async (eventId: string, data: CreateIncidencia) => {
  try {
    await requireActiveSession();
    const validatedData = CreateIncidenciaSchema.parse(data);

    const incidencia = await prisma.incident.create({
      data: {
        eventId,
        attendeeId: validatedData.attendeeId ? validatedData.attendeeId : null,
        description: validatedData.description,
        category: validatedData.category,
      },
      include: {
        attendee: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      success: true,
      message: "Incidencia registrada correctamente",
      data: incidencia,
    };
  } catch (error) {
    await logServerError({
      error,
      event: "incidencias.create.failed",
      feature: "incidencias",
      operation: "create_incidencia",
      context: { eventId },
    });
    return {
      success: false,
      message: "No se pudo registrar la incidencia. Inténtalo nuevamente.",
    };
  }
};
