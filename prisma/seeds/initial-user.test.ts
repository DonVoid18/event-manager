import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrismaClient } from "@prisma/client";
import { passwordIsValid } from "../../src/shared/infrastructure/libs/password";
import { initialUser, seedInitialUser } from "./initial-user";

test("genera y muestra la contraseña solo al crear, conservando el usuario existente", async (t) => {
  const output = t.mock.method(console, "log", () => {});
  let savedPassword: string | undefined;
  const prisma = { user: { upsert: async (args: {
    where: { email: string }; update: object; create: { password: string };
  }) => {
    assert.equal(args.where.email, initialUser.email);
    assert.deepEqual(args.update, {});
    savedPassword ??= args.create.password;
    return { password: savedPassword };
  } } };
  await seedInitialUser(prisma as unknown as PrismaClient);
  const message = String(output.mock.calls[0].arguments[0]);
  assert.match(message, /^Contraseña inicial generada: [A-Za-z0-9_-]{32}$/);
  const password = message.split(": ")[1];
  assert.ok(await passwordIsValid(password, savedPassword!));
  const originalHash = savedPassword;
  await seedInitialUser(prisma as unknown as PrismaClient);
  assert.equal(savedPassword, originalHash);
  assert.equal(output.mock.calls.length, 2);
  assert.equal(output.mock.calls[1].arguments[0], "El usuario inicial ya existe; se conserva su contraseña.");
});

test("no muestra credenciales si falla la persistencia", async (t) => {
  const output = t.mock.method(console, "log", () => {});
  const prisma = { user: { upsert: async () => { throw new Error("Fallo simulado"); } } };
  await assert.rejects(seedInitialUser(prisma as unknown as PrismaClient));
  assert.equal(output.mock.calls.length, 0);
});
