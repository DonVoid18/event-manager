/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const script = fs.existsSync(path.join(__dirname, "server.js"))
  ? "server.js"
  : ".next/standalone/server.js";

module.exports = {
  apps: [
    {
      name: "event-manager",
      script,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
