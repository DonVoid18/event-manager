import { prisma } from "../src/shared/infrastructure/libs/prisma";
import { seedDemoEventData } from "./seeds/demo-event-data";

seedDemoEventData(prisma)
  .catch((error) => {
    console.error("Falló la carga de datos de ejemplo.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
