# Event Manager

Aplicación Next.js 15 con React 19, TypeScript, Prisma, PostgreSQL y Auth.js. El despliegue principal sigue la estructura de `template-project-nextjs-standalone`: Next.js standalone con PM2 en el host, Nginx como proxy HTTPS y PostgreSQL separado. La configuración Blue-Green con Docker permanece documentada en [README.blue-green.md](README.blue-green.md) para instalaciones existentes.

## Desarrollo local

Requiere Node.js 22.14.0, pnpm 10.10.0 y PostgreSQL 17. El `docker-compose.yml` nuevo inicia solo PostgreSQL y publica el puerto exclusivamente en `127.0.0.1`. Usa un proyecto Compose propio para no montar el volumen de la instalación Blue-Green.

```powershell
Copy-Item .env.example .env
docker compose up -d db
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate:deploy
pnpm dev
```

Configura un `NEXTAUTH_SECRET` aleatorio y confirma que `DATABASE_URL` apunta a esta base local antes de migrar. En el host usa `DB_HOST=127.0.0.1`; el servicio Docker expone `DB_PORT` solo al propio host. Los archivos privados quedan en `private` y se entregan por las rutas autenticadas.

## Acceso privado

El inicio de sesión admite únicamente correo y contraseña. No hay registro público ni proveedores OAuth. Un administrador crea las cuentas adicionales desde `/usuarios` y les asigna el rol correspondiente. Para una instalación nueva, crea primero una cuenta administradora mediante un procedimiento seguro de aprovisionamiento. Carga datos de demostración en producción solo cuando se solicite expresamente. Entrega la contraseña inicial por un canal privado y cámbiala después del primer acceso.

Para cargar únicamente los eventos y sus datos de ejemplo en una base autorizada, ejecuta `pnpm db:seed:demo` después de confirmar `DATABASE_URL`. El comando no crea usuarios, no modifica eventos existentes y aplica la carga completa dentro de una transacción. `pnpm db:seed` conserva el seed de desarrollo que también aprovisiona el usuario inicial.

## Verificación

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

En Linux, `pnpm build:standalone` crea `.next/standalone`, copia los assets públicos, el esquema y migraciones Prisma, y los archivos necesarios para ejecutar el proceso. `pnpm start:standalone` lo inicia desde la raíz del repositorio. En Windows, Next.js puede requerir permisos para crear enlaces simbólicos durante este empaquetado; el workflow de CI lo verifica en Ubuntu.

`/api/health` comprueba el proceso y `/api/health/ready` comprueba también PostgreSQL, el esquema esencial y los permisos de `private`.

## Preparar Ubuntu

Instala Node.js 22, pnpm 10, PM2, Nginx y Docker con Compose si PostgreSQL estará en un contenedor. Crea una carpeta propia para esta aplicación, un `.env` con `NEXTAUTH_URL` HTTPS, `NEXTAUTH_SECRET` y una conexión `DATABASE_URL` válida. En producción, escribe la URL de conexión completa con las credenciales codificadas cuando tengan caracteres reservados. Conserva `.env`, `private` y el volumen de PostgreSQL fuera de los artefactos de compilación. Restringe 5432 al host.

```bash
cp .env.example .env
chmod 600 .env
mkdir -p private
chmod 700 private
docker compose up -d db
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build:standalone
pnpm db:migrate:deploy
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Ejecuta `docker compose up -d db` solo después de comprobar que se trata de la base prevista para esta instalación. Si usas PostgreSQL nativo, omite ese comando. Configura [nginx.standalone.conf.example](scripts/deploy/nginx.standalone.conf.example) con el dominio real, valida con `sudo nginx -t` y obtén HTTPS con Certbot. Hay un [servicio systemd de ejemplo](scripts/deploy/event-manager.service.example) si prefieres systemd a PM2.

Para compilación y despliegue manual desde un checkout del código, ejecuta `bash scripts/deploy/deploy-standalone.sh`. Aplica las migraciones una vez después de compilar, recarga PM2 y verifica readiness. La [variante PowerShell](scripts/deploy/deploy-standalone.ps1) prepara el build local.

## CI/CD con GitHub Actions

El workflow `ci.yml` valida el código y los archivos de despliegue. `deploy.yml` compila standalone en Ubuntu, empaqueta `.next/standalone`, transfiere el artefacto por SSH, instala dependencias con el lockfile, genera Prisma, aplica migraciones, recarga PM2 y comprueba `/api/health/ready`. Se puede disparar manualmente o con push a `main` cuando la variable del repositorio `DEPLOY_ENABLED=true`.

Configura el environment `production`:

| Tipo | Nombre | Contenido |
| --- | --- | --- |
| Variable | `DEPLOY_HOST` | Host o IP del servidor. |
| Variable | `DEPLOY_USER` | Usuario SSH con acceso a la carpeta, pnpm y PM2. |
| Variable | `DEPLOY_PATH` | Ruta absoluta de la aplicación, con su `.env` y `private`. |
| Variable opcional | `DEPLOY_PORT` | Puerto SSH; 22 por defecto. |
| Secret | `SSH_PRIVATE_KEY` | Clave privada para ese usuario. |
| Secret | `SSH_KNOWN_HOSTS` | Identidad SSH del servidor verificada por otro canal. |

El servidor debe tener Node.js y pnpm; PM2 debe estar configurado para el usuario SSH. El workflow no prepara Nginx, certificados, base de datos ni `.env`. No habilites `DEPLOY_ENABLED` antes de completar la configuración y revisar el cambio desde Blue-Green, si existe. Un rollback de PM2 no revierte datos; prepara migraciones compatibles con la versión que sigue activa.

## Migración desde Blue-Green

Este repositorio conserva `deploy.sh`, `compose.prod.yml`, `compose.cert.yml`, `renew-certs.sh`, `Dockerfile` y el workflow manual `deploy-blue-green.yml` para las instalaciones actuales. El `docker-compose.yml` standalone usa un nombre de proyecto distinto y por ello crea otro volumen PostgreSQL. **No inicia ni migra automáticamente la base anterior.** Antes de cambiar Nginx o arrancar otra base, identifica el volumen activo, prepara respaldo y planifica la transferencia de datos y `private` en una ventana de mantenimiento. No montes un mismo volumen de PostgreSQL en dos contenedores ni ejecutes `down -v`.

La aprobación de estos cambios de código no implica desplegar en producción.
