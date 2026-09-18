import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { passwordEncrypt } from "../../src/shared/infrastructure/libs/password";

// Configura el usuario inicial aquí antes de ejecutar el seed o construir la imagen.
// No subas contraseñas reales al repositorio.
export const initialUser = {
  email: "admin@example.com",
  name: "Administrador",
};

const settingsSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1),
});

export async function seedInitialUser(prisma: PrismaClient) {
  const settings = settingsSchema.safeParse(initialUser);
  if (!settings.success) {
    console.error("Configura email y name en prisma/seeds/initial-user.ts (contraseña: mínimo 12 caracteres, máximo 72 bytes).");
    throw new Error("Configuración del seed inválida.");
  }
  const { email, name } = settings.data;
  const password = randomBytes(24).toString("base64url");
  const hashedPassword = await passwordEncrypt(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    select: { password: true },
    create: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: process.env.VERIFICATION_EMAIL_ACTIVE === "true" ? null : new Date(),
    },
  });
  if (user.password === hashedPassword) {
    console.log(`Contraseña inicial generada: ${password}`);
  } else {
    console.log("El usuario inicial ya existe; se conserva su contraseña.");
  }
}
