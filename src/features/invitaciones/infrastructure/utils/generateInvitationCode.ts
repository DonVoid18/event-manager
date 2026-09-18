import { prisma } from "@/shared/infrastructure/libs/prisma";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const MAX_ATTEMPTS = 10;

function randomSegment() {
  let segment = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    segment += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return segment;
}

export async function generateUniqueInvitationCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = `INV-${randomSegment()}`;
    const existing = await prisma.invitation.findUnique({ where: { code } });
    if (!existing) {
      return code;
    }
  }

  throw new Error("No se pudo generar un código único para la invitación");
}
