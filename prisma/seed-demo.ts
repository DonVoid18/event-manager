import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { seedDemoEventData } from "./seeds/demo-event-data";

expand(config());

async function main() {
  const { prisma } = await import("../src/shared/infrastructure/libs/prisma");

  try {
    await seedDemoEventData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Falló la carga de datos de ejemplo.", error);
  process.exitCode = 1;
});
