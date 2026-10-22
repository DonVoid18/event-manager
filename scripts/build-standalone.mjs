import { spawnSync } from "node:child_process";
import path from "node:path";

const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const build = spawnSync(process.execPath, [nextCli, "build", "--turbopack"], {
  env: { ...process.env, NEXT_OUTPUT: "standalone" },
  stdio: "inherit",
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

await import("./prepare-standalone.mjs");
