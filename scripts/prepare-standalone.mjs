import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.error('No se encontró .next/standalone. Verifica output: "standalone".');
  process.exit(1);
}

const directories = [
  [path.join(root, ".next", "static"), path.join(standalone, ".next", "static")],
  [path.join(root, "public"), path.join(standalone, "public")],
  [path.join(root, "prisma"), path.join(standalone, "prisma")],
];

for (const [source, destination] of directories) {
  if (fs.existsSync(source)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true, force: true });
  }
}

for (const file of [
  ".env.example",
  "docker-compose.yml",
  "ecosystem.config.cjs",
  "prisma.config.ts",
  "package.json",
  "pnpm-lock.yaml",
]) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(standalone, file));
}

for (const name of fs.readdirSync(standalone)) {
  if (name === "private" || (name.startsWith(".env") && name !== ".env.example")) {
    fs.rmSync(path.join(standalone, name), { recursive: true, force: true });
  }
}

console.log("Build standalone preparado en .next/standalone.");
