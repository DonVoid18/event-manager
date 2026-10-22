"use server";

import { es } from "date-fns/locale";
import { format } from "date-fns";
import QRCode from "qrcode";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";
import {
  fromEmail,
  resend,
} from "@/shared/infrastructure/resend/infrastructure/utils/resend";
import { INVITATION_QR_CONTENT_ID, InvitationEmailTemplate } from "@/shared/infrastructure/resend/infrastructure/components/InvitationEmailTemplate";
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

    if (
      attendee.email.toLowerCase().endsWith("@example.invalid") ||
      attendee.email.toLowerCase().endsWith("@invitados.eventos.tumitechplus.com")
    ) {
      return { success: false, message: "No se puede enviar una invitación a esta dirección de correo" };
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

    // El QR contiene el código de invitación y se adjunta como imagen embebida en el correo.
    const qrImage = await QRCode.toBuffer(invitation.code, { width: 320, margin: 1 });

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: [attendee.email],
      subject: `Invitación a ${attendee.event.name}`,
      react: InvitationEmailTemplate({
        attendeeName: `${attendee.firstName} ${attendee.lastName}`,
        eventName: attendee.event.name,
        eventDateLabel,
        invitationCode: invitation.code,
        qrContentId: INVITATION_QR_CONTENT_ID,
      }),
      attachments: [
        {
          filename: `${invitation.code}.png`,
          content: qrImage,
          contentId: INVITATION_QR_CONTENT_ID,
        },
      ],
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
