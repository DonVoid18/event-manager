#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$project_dir"

if [[ ! -f .env ]]; then
  echo "Falta $project_dir/.env. Créalo desde .env.example." >&2
  exit 1
fi

command -v node >/dev/null || { echo "Node.js no está instalado." >&2; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm no está instalado." >&2; exit 1; }

pnpm install --frozen-lockfile --prod=false
pnpm db:generate
pnpm build:standalone
pnpm db:migrate:deploy

mkdir -p private
if command -v pm2 >/dev/null; then
  pm2 startOrReload ecosystem.config.cjs --update-env
  for attempt in {1..15}; do
    if curl --silent --show-error --fail http://127.0.0.1:3000/api/health/ready >/dev/null; then
      pm2 save
      echo "Despliegue standalone correcto."
      exit 0
    fi
    sleep 2
  done
  echo "La aplicación no superó el healthcheck de readiness tras $attempt intentos." >&2
  exit 1
fi

echo "Build listo. Inicia con: pnpm start:standalone"
