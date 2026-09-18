"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";
import { CreateEvento, CreateEventoSchema } from "../../domain/validations/createEvento";

export const updateEventoAction = async (id: string, data: CreateEvento) => {
  try {
    await requireActiveSession();
    const validatedData = CreateEventoSchema.parse(data);

    const evento = await prisma.event.update({
      where: { id },
      data: {
        name: validatedData.name,
        eventDate: new Date(validatedData.eventDate),
        type: validatedData.type,
        capacity: validatedData.capacity,
      },
    });

    return {
      success: true,
      message: "Evento actualizado correctamente",
      data: evento,
    };
  } catch (error) {
    await logServerError({
      error,
      event: "eventos.update.failed",
      feature: "eventos",
      operation: "update_evento",
      context: { eventoId: id },
    });
    return {
      success: false,
      message: "No se pudo actualizar el evento. Inténtalo nuevamente.",
    };
  }
};
