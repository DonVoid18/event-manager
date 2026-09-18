"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";
import { LocalFileRepository } from "@/shared/infrastructure/repository/LocalFileRepository";
import { FileService } from "@/shared/infrastructure/services/S3FileService";
import { CreateAsistente, getAsistenteSchema } from "../../domain/validations/createAsistente";
import { validateReceiptFile } from "../utils/validateReceiptFile";

export const createAsistenteAction = async (eventId: string, formData: FormData) => {
  try {
    await requireActiveSession();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { attendees: true } } },
    });

    if (!event) {
      return { success: false, message: "El evento no existe" };
    }

    if (event._count.attendees >= event.capacity) {
      return {
        success: false,
        message: "Se alcanzó el aforo máximo del evento. No se pueden registrar más asistentes.",
      };
    }

    const rawData = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      documentId: String(formData.get("documentId") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      ...(event.type === "PAGO"
        ? {
          paymentAmount: Number(formData.get("paymentAmount")),
          paymentReference: String(formData.get("paymentReference") ?? ""),
        }
        : {}),
    };

    const schema = getAsistenteSchema(event.type);
    const validatedData = schema.parse(rawData) as CreateAsistente;

    const duplicate = await prisma.attendee.findFirst({
      where: {
        eventId,
        OR: [{ documentId: validatedData.documentId }, { email: validatedData.email }],
      },
    });

    if (duplicate) {
      const field =
        duplicate.documentId === validatedData.documentId ? "documento de identidad" : "correo electrónico";
      return {
        success: false,
        message: `Ya existe un asistente registrado con este ${field} para este evento`,
      };
    }

    let paymentReceiptKey: string | null = null;
    if (event.type === "PAGO") {
      const receipt = formData.get("receipt");
      if (!(receipt instanceof File) || receipt.size === 0) {
        return { success: false, message: "El comprobante de pago es obligatorio para eventos de pago" };
      }

      const validation = await validateReceiptFile(receipt);
      if (!validation.success) {
        return { success: false, message: validation.error };
      }

      const fileService = new FileService(new LocalFileRepository());
      const metadata = await fileService.uploadFile({
        file: validation.buffer,
        fileName: receipt.name,
        mimeType: receipt.type,
        folder: "comprobantes",
      });
      paymentReceiptKey = metadata.key;
    }

    const asistente = await prisma.attendee.create({
      data: {
        eventId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        documentId: validatedData.documentId,
        email: validatedData.email,
        phone: validatedData.phone || null,
        paymentAmount: validatedData.paymentAmount ?? null,
        paymentReference: validatedData.paymentReference ?? null,
        paymentReceiptKey,
      },
    });

    return {
      success: true,
      message: "Asistente registrado correctamente",
      data: asistente,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        message: "Ya existe un asistente registrado con este documento o correo para este evento",
      };
    }

    await logServerError({
      error,
      event: "asistentes.create.failed",
      feature: "asistentes",
      operation: "create_asistente",
      context: { eventId },
    });
    return {
      success: false,
      message: "No se pudo registrar al asistente. Inténtalo nuevamente.",
    };
  }
};
