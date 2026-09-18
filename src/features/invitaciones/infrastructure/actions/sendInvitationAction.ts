"use server";

import { es } from "date-fns/locale";
import { format } from "date-fns";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";
import {
  fromEmail,
  resend,
} from "@/shared/infrastructure/resend/infrastructure/utils/resend";
import { InvitationEmailTemplate } from "@/shared/infrastructure/resend/infrastructure/components/InvitationEmailTemplate";
import { generateUniqueInvitationCode } from "../utils/generateInvitationCode";

export const sendInvitationAction = async (attendeeId: string) => {
  try {
    await requireActiveSession();

    const attendee = await prisma.attendee.findUnique({
      where: { id: attendeeId },
      include: { event: true, invitation: true },
    });

    if (!attendee) {
      return { success: false, message: "El asistente no existe" };
    }

    let invitation = attendee.invitation;
    if (!invitation) {
      const code = await generateUniqueInvitationCode();
      invitation = await prisma.invitation.create({
        data: { attendeeId, code, status: "PENDIENTE" },
      });
    }

    const eventDateLabel = format(attendee.event.eventDate, "dd 'de' MMMM 'de' yyyy, HH:mm", {
      locale: es,
    });

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: [attendee.email],
      subject: `Invitación a ${attendee.event.name}`,
      react: InvitationEmailTemplate({
        attendeeName: `${attendee.firstName} ${attendee.lastName}`,
        eventName: attendee.event.name,
        eventDateLabel,
        invitationCode: invitation.code,
      }),
    });

    if (sendError) {
      throw new Error(sendError.message);
    }

    const updated = await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ENVIADA", sentAt: new Date() },
    });

    await prisma.invitationStatusHistory.create({
      data: { invitationId: invitation.id, status: "ENVIADA" },
    });

    return {
      success: true,
      message: "Invitación enviada correctamente",
      data: updated,
    };
  } catch (error) {
    await logServerError({
      error,
      event: "invitaciones.send.failed",
      feature: "invitaciones",
      operation: "send_invitation",
      context: { attendeeId },
    });
    return {
      success: false,
      message: "No se pudo enviar la invitación. Inténtalo nuevamente.",
    };
  }
};
