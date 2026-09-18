"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";
import {
  UpdateInvitationStatus,
  UpdateInvitationStatusSchema,
} from "../../domain/validations/updateInvitationStatus";

export const updateInvitationStatusAction = async (
  invitationId: string,
  data: UpdateInvitationStatus
) => {
  try {
    await requireActiveSession();
    const validated = UpdateInvitationStatusSchema.parse(data);

    const updated = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: validated.status,
        ...(validated.status === "ENVIADA" ? { sentAt: new Date() } : {}),
      },
    });

    await prisma.invitationStatusHistory.create({
      data: { invitationId, status: validated.status },
    });

    return {
      success: true,
      message: "Estado de la invitación actualizado",
      data: updated,
    };
  } catch (error) {
    await logServerError({
      error,
      event: "invitaciones.update_status.failed",
      feature: "invitaciones",
      operation: "update_invitation_status",
      context: { invitationId },
    });
    return {
      success: false,
      message: "No se pudo actualizar el estado de la invitación.",
    };
  }
};
