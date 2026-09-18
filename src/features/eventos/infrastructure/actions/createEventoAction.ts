"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";
import { CreateEvento, CreateEventoSchema } from "../../domain/validations/createEvento";
import { generateUniqueEventCode } from "../utils/generateEventCode";

export const createEventoAction = async (data: CreateEvento) => {
  try {
    await requireActiveSession();
    const validatedData = CreateEventoSchema.parse(data);
    const code = await generateUniqueEventCode();

    const evento = await prisma.event.create({
      data: {
        code,
        name: validatedData.name,
        eventDate: new Date(validatedData.eventDate),
        type: validatedData.type,
        capacity: validatedData.capacity,
      },
    });

    return {
      success: true,
      message: `Evento registrado correctamente con el código ${evento.code}`,
      data: evento,
    };
  } catch (error) {
    await logServerError({
      error,
      event: "eventos.create.failed",
      feature: "eventos",
      operation: "create_evento",
    });
    return {
      success: false,
      message: "No se pudo registrar el evento. Inténtalo nuevamente.",
    };
  }
};
