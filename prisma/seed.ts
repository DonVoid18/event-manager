import { prisma } from "../src/shared/infrastructure/libs/prisma";
import { seedInitialUser } from "./seeds/initial-user";
import { seedDemoEventData } from "./seeds/demo-event-data";

// Agrega los seeds del proyecto en el orden de sus dependencias.
const seeds = [
  { name: "initial-user", run: seedInitialUser },
  { name: "demo-event-data", run: seedDemoEventData },
];

async function main() {
  for (const seed of seeds) {
    console.log(`Ejecutando seed: ${seed.name}...`);
    await seed.run(prisma);
    console.log(`Seed completado: ${seed.name}.`);
  }
}
main()
  .catch((error) => {
    console.error("Falló el seed. Revisa su configuración y el acceso a la base de datos.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
