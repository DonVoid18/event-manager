# Next.js con despliegue Blue-Green sencillo

La nueva imagen arranca antes de recibir tráfico. Nginx cambia hacia ella cuando
está lista; la anterior queda disponible para volver atrás. Ambas usan la misma
base PostgreSQL y la misma carpeta `private`.

## Qué incluye el proyecto

Plantilla con Next.js 15.5.7 (App Router), React 19, TypeScript, Tailwind CSS 4,
shadcn/ui, Auth.js y Prisma 7.4 sobre PostgreSQL. Incluye registro e inicio de
sesión, recuperación y verificación de correo, perfil y gestión de productos con
imágenes locales privadas. También contiene utilidades de almacenamiento S3.

| Carpeta | Contenido |
| --- | --- |
| `src/app` | Rutas, layouts, páginas de entrada y endpoints. |
| `src/features` | Autenticación y productos; esquemas en `domain`, acciones y UI en `infrastructure`. |
| `src/shared` | Componentes comunes, autenticación, Prisma, archivos y logging. |
| `prisma` | Esquema, migraciones versionadas y seeds. |
| `private` | Archivos locales; no deben copiarse a `public` ni subirse a Git. |
| `scripts/deploy` | Control y pruebas del despliegue Blue-Green. |

## Desarrollo local en Windows

Ejecuta los comandos PowerShell desde la raíz del repositorio. Sigue esta opción
si vas a editar código: Next.js corre en Windows y PostgreSQL en Docker.

### 1. Preparar herramientas y configuración

Instala Git, Node.js **22.14.0** (versión utilizada por Docker y CI) y Docker
Desktop con contenedores Linux. El proyecto fija **pnpm 10.10.0** en `package.json`.

```powershell
node --version
corepack enable
pnpm --version
docker version
docker compose version
```

Clona tu repositorio si aún no lo tienes y entra en su carpeta. Copia el ejemplo
solo la primera vez; no sobrescribas un `.env` que ya configuraste:

```powershell
Copy-Item .env.example .env
New-Item -ItemType Directory -Force private
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Guarda el valor aleatorio generado en `NEXTAUTH_SECRET`. Edita `.env` con estos
valores de conexión para desarrollo local:

```dotenv
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
DB_DRIVER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=application_db
DB_USERNAME=postgres
DB_PASSWORD=application_db
DATABASE_URL="${DB_DRIVER}://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
VERIFICATION_EMAIL_ACTIVE=false
```

La contraseña del ejemplo es solo para desarrollo. Usa credenciales propias en
el servidor. Si contienen caracteres reservados de URL, escribe `DATABASE_URL`
con usuario y contraseña codificados; conserva `DB_PASSWORD` con su valor real.

### 2. Arrancar la base e instalar dependencias

```powershell
docker compose -f compose.dev.yml up -d db
docker compose -f compose.dev.yml exec db pg_isready -U postgres -d application_db
pnpm install --frozen-lockfile
pnpm db:generate
```

Adapta usuario y base del sondeo si los cambiaste. Continúa cuando PostgreSQL
indique `accepting connections`. Si aún está arrancando, consulta sus logs y
repite el sondeo. Si el puerto 5432 está ocupado, elige otro `DB_PORT` local.

### 3. Aplicar el esquema e iniciar la aplicación

Comprueba que `DATABASE_URL` apunta a tu base de desarrollo antes de migrar o
ejecutar seeds. Para una copia nueva, aplica las migraciones existentes:

```powershell
pnpm db:migrate:deploy
pnpm dev
```

Abre [la aplicación local](http://localhost:3000). Puedes crear una cuenta en
`/auth/sign-up` e iniciar sesión en `/auth/sign-in`. Para crear el usuario inicial
mediante seed, configura `email` y `name` en el objeto `initialUser` de
`prisma/seeds/initial-user.ts` y ejecuta `pnpm db:seed` en otra terminal.
Consulta las condiciones del seed en la sección de inicialización de datos.

### 4. Comprobar que funciona

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/health/ready
```

Ambas rutas deben devolver `status: ok`. La segunda comprueba conexión a la
base, existencia de la tabla `products` y permisos de lectura/escritura en
`private`. Prueba iniciar sesión, abrir `/perfil`, crear un producto en
`/productos`, adjuntar una imagen y volver a consultarla.

Detén Next.js con `Ctrl+C`. Para detener solo PostgreSQL sin borrar datos:

```powershell
docker compose -f compose.dev.yml stop db
```

### 5. Trabajar en cambios de esquema y verificar código

Después de editar `prisma/schema.prisma`, crea la migración en tu base de
desarrollo y regenera el cliente:

```powershell
pnpm db:migrate:dev --name descripcion_del_cambio
pnpm db:generate
pnpm exec prisma validate
```

Versiona el esquema y la nueva carpeta de migración. No modifiques migraciones
ya aplicadas. `db:migrate:dev` es para desarrollar cambios; producción utiliza
`migrate deploy` mediante `deploy.sh`. `db:migrate:reset` borra datos y no es
parte del procedimiento normal.

Antes de publicar código:

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Puedes consultar datos con `pnpm db:studio`. No hay script `pnpm test` en el
proyecto; las pruebas del despliegue se describen más abajo.

## Alternativa: desarrollo completamente dentro de Docker

Utiliza el mismo `.env` local, pero cambia `DB_HOST=db` y `DB_PORT=5432`:
el proceso Next.js se conecta a PostgreSQL por la red interna. Conserva
`NEXTAUTH_URL=http://localhost:3000` para acceder desde el navegador.
No ejecutes simultáneamente el Next.js local y el servicio `app` en el puerto 3000.

```powershell
docker compose -f compose.dev.yml up -d db
docker compose -f compose.dev.yml exec db pg_isready -U postgres -d application_db
docker compose -f compose.dev.yml build app
docker compose -f compose.dev.yml run --rm app pnpm db:migrate:deploy
docker compose -f compose.dev.yml up -d app
docker compose -f compose.dev.yml logs --tail=100 app
```

Espera a que la base acepte conexiones antes de aplicar migraciones. El cliente
Prisma se genera al construir la imagen, pero **las migraciones no se ejecutan
automáticamente**. Para el seed opcional, usa
`docker compose -f compose.dev.yml run --rm app pnpm db:seed`.

Este Compose solo monta `public` y `private`; el código queda copiado dentro de
la imagen. Después de editar código ejecuta
`docker compose -f compose.dev.yml up -d --build app`. Para recarga automática
al editar, utiliza el desarrollo local descrito arriba. Para detener ambos
servicios conservando datos: `docker compose -f compose.dev.yml stop`.

## Variables e integraciones

Mantén un `.env` por equipo, con valores propios de ese entorno. El archivo está
ignorado por Git y excluido de la imagen Docker; producción lo inyecta al arrancar.

| Variables | Cuándo configurarlas |
| --- | --- |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST` | Autenticación; secreto aleatorio, URL del entorno y confianza en el proxy. |
| `DB_*`, `DATABASE_URL` | Siempre. Windows usa `localhost`; contenedores usan `db:5432`. |
| `SSL_EMAIL` | Obtención del certificado en Ubuntu. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envío de correo: recuperación de contraseña y verificación. Usa un remitente autorizado en Resend. |
| `VERIFICATION_EMAIL_ACTIVE` | `false` permite empezar sin verificar correo; `true` requiere configurar el envío. La recuperación de contraseña sigue necesitando correo. |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | Inicio de sesión con GitHub. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Inicio de sesión con Google. |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` | Utilidades S3; las imágenes actuales de productos usan almacenamiento local y no requieren S3. |
| `LOG_LEVEL`, `LOG_SERVICE_NAME` | Nivel y nombre de servicio de los logs estructurados. |

Para OAuth, registra en cada proveedor la URL de retorno de tu entorno:
`http://localhost:3000/api/auth/callback/github` o
`http://localhost:3000/api/auth/callback/google`. En producción sustituye el origen
por tu dominio HTTPS. Los proveedores están declarados en el código; dejar sus
credenciales vacías no los configura ni oculta sus opciones en la interfaz.

## Primera publicación: orden de los pasos

El flujo es **Windows → Docker Hub → Ubuntu**. Primero preparas el servidor y
su certificado; después construyes y publicas la imagen desde Windows; finalmente
la descargas y despliegas en Ubuntu. Ejecuta los tres pasos siguientes en orden.

**`deploy.sh` no compila el código del servidor.** Necesita una imagen ya publicada
en un registro y accesible para el servidor. Si no existe en Docker Hub, completa
el paso 2 antes de desplegar. Tener el repositorio en Ubuntu no sustituye la imagen.

## 1. Ubuntu: preparar el servidor y obtener el certificado

Ejecuta los comandos de esta sección por SSH, desde la carpeta del repositorio.

1. Instala Docker con Compose, Bash y Python 3.10 o posterior en Linux.
2. Copia el repositorio y prepara **un único `.env`**, igual que antes:
   - `NEXTAUTH_URL`: la URL HTTPS real de la aplicación.
   - `NEXTAUTH_SECRET`: un secreto aleatorio de al menos 32 caracteres.
   - `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` y `DATABASE_URL`: deben corresponder
     a la misma base en `db:5432`. Codifica caracteres especiales en la URL.
   - `SSL_EMAIL`: correo para obtener el certificado.
   - Las variables de OAuth, correo o S3 que utilice tu proyecto.

   En una instalación nueva, entra en la carpeta clonada y ejecuta:

   ```bash
   docker version
   docker compose version
   python3 --version
   cp .env.example .env
   python3 -c 'import secrets; print(secrets.token_hex(32))'
   nano .env
   ```

   Guarda el secreto generado en `NEXTAUTH_SECRET`. Usa `DB_HOST=db` y
   `DB_PORT=5432`; no copies `localhost` desde el entorno de Windows.
   Por ejemplo, `NEXTAUTH_URL=https://app.tudominio.com`, sin rutas adicionales.
   Los comandos Docker deben funcionar con el usuario que hará los despliegues.
3. Protege `.env` con `chmod 600 .env`. Prepara los archivos privados:

   ```bash
   mkdir -p private
   sudo chown 1000:1000 private
   sudo chmod 770 private
   ```

4. Apunta el dominio al servidor y abre 80/443. Para obtener el certificado:

   ```bash
   bash deploy.sh certificate
   ```

   Se prepara PostgreSQL y Nginx de mantenimiento si aún no existen; no se
   ejecutan migraciones en este paso. El dominio se obtiene de `NEXTAUTH_URL`.
   El comando muestra el progreso de infraestructura, Certbot y recarga de Nginx,
   y confirma cuando termina correctamente. Si es la primera instalación, Nginx
   permanece en mantenimiento por HTTP hasta desplegar la primera imagen; obtener
   el certificado todavía no publica la aplicación ni activa HTTPS.

   Comprueba que los registros DNS A y, si existe, AAAA apuntan a este servidor,
   que los puertos están permitidos en el firewall y en el proveedor de hosting,
   y que otro servicio no ocupa 80/443. Conserva el acceso SSH al ajustar el firewall.

**No hay `.env.production`, rutas de estado que configurar, nombres de red que
inventar ni temporizadores que instalar.** El script gestiona `.deploy` automáticamente.
No edites esa carpeta ni la publiques.

Si ya tenías una instalación, conserva la carpeta y el nombre de proyecto Compose:
así se reutilizan los volúmenes `dbdata`, `certbot-etc` y `certbot-webroot` existentes.
La conversión inicial del Nginx antiguo requiere una ventana de mantenimiento;
no ejecutes dos PostgreSQL sobre el mismo volumen ni uses `down -v`.
Los siguientes cambios de imagen utilizan Blue-Green.

## 2. Windows: construir y publicar la imagen en Docker Hub

En tu equipo Windows, inicia Docker Desktop con contenedores Linux y abre
PowerShell en la carpeta del proyecto. Necesitas una cuenta de Docker Hub con
permiso para publicar en el repositorio de destino. Confirma en Git los cambios
que vas a publicar: el script rechaza una carpeta con cambios pendientes.

Inicia sesión y construye/publica la imagen (sustituye `miusuario` por tu usuario
de Docker Hub y usa una etiqueta nueva en cada publicación):

```powershell
docker login
./docker-build-push.ps1 -Username miusuario -Tag v1.0.0
```

Este comando compila la aplicación y sube **una sola imagen** a Docker Hub.
El nombre del repositorio se obtiene del nombre de la carpeta local, en minúsculas.
Por ejemplo, desde `C:\TRABAJO\template-project-nextjs` se publica
`miusuario/template-project-nextjs:v1.0.0`. La carpeta de Ubuntu puede tener otro nombre.

Al terminar correctamente, el script muestra el comando exacto para Ubuntu:

```text
En el servidor: bash deploy.sh miusuario/template-project-nextjs:v1.0.0
```

Continúa solo si la compilación y la publicación finalizaron sin errores. Si omites
`-Tag`, se usan los primeros 12 caracteres del commit. `-SkipPush` solo construye
localmente: no sirve para completar este flujo hasta que publiques la imagen.
No reutilices etiquetas ni recompiles un mismo commit con distinto contenido.
La plataforma predeterminada es `linux/amd64`; para un servidor ARM, usa
`-Platform linux/arm64`. No hace falta preparar una clave adicional para compilar.

## 3. Ubuntu: desplegar la imagen publicada y comprobar la aplicación

Regresa a la sesión SSH y a la carpeta del repositorio en Ubuntu. Si la imagen es
privada, ejecuta `docker login` con el mismo usuario del sistema que ejecutará
`deploy.sh`; la sesión de Docker de Windows no se comparte con Ubuntu.

Ejecuta el comando exacto que mostró el paso 2. Por ejemplo:

```bash
bash deploy.sh miusuario/template-project-nextjs:v1.0.0
```

Sustituye el ejemplo por tu imagen real. Si la imagen o su etiqueta no existen,
o no tienes acceso, el comando falla al descargarla; no intenta compilar en Ubuntu.

El script descarga y fija la imagen por digest, prepara sus recursos estáticos,
aplica `prisma migrate deploy` una sola vez y arranca el contenedor libre.
Comprueba PostgreSQL y acceso a `private` antes de cambiar Nginx. Valida la
configuración, recarga sin reiniciar Nginx y comprueba la URL pública. Si esa
comprobación falla, verifica la anterior y devuelve el tráfico hacia ella.

La anterior queda encendida **hasta el siguiente despliegue**, que reutiliza ese
contenedor. No hay un paso manual de retirada. Deja al menos un minuto entre
cambios para terminar solicitudes en curso. No se borran volúmenes ni imágenes.

Al finalizar debe aparecer `Despliegue correcto`. Comprueba la versión con
`bash deploy.sh status` y abre en el navegador la URL HTTPS de `NEXTAUTH_URL`.
En la primera instalación, este despliegue activa la aplicación y HTTPS usando
el certificado obtenido en el paso 1.

## Actualizaciones y recuperación

### Inicializar datos (seeds)

Configura `email` y `name` en el objeto `initialUser` de
`prisma/seeds/initial-user.ts` antes de construir y desplegar la imagen.
La contraseña se deja vacía en el repositorio; complétala para ejecutar el seed
y no subas contraseñas reales a Git. Estos datos no se leen de `.env`.
La contraseña debe tener al menos 12 caracteres y como máximo 72 bytes UTF-8.
Comprueba que `DATABASE_URL` corresponde a la base que quieres inicializar y ejecuta:

```bash
bash deploy.sh seed
```

Usa un contenedor temporal de la imagen activa, el mismo `.env` y el bloqueo del
despliegue. No necesitas entrar al contenedor. No aplica migraciones ni se ejecuta
automáticamente al actualizar. Si falla, no se reintenta automáticamente; los seeds
anteriores pueden haber terminado y sus cambios no se revierten.

El seed inicial crea el usuario solo si su correo no existe. Al repetirlo conserva
los datos y contraseña existentes. No asigna roles: el modelo actual no tiene roles.
Con `VERIFICATION_EMAIL_ACTIVE=true`, el correo queda pendiente de verificación.
El comando muestra la contraseña inicial generada; el resto de los mensajes internos
del contenedor permanece capturado. En desarrollo usa `pnpm db:seed`.

Para agregar seeds, crea módulos en `prisma/seeds` con funciones que reciban el
cliente Prisma y regístralos en la lista `seeds` de `prisma/seed.ts`, en orden de
dependencias. Cada seed debe poder repetirse sin duplicar datos ni sobrescribir
cambios del usuario. Usa imports relativos y comprueba que cualquier dependencia
local nueva esté incluida en la etapa `runner` del Dockerfile.

Al incorporar este cambio por primera vez, publica y despliega una **nueva etiqueta**
desde Windows; la imagen anterior no contiene estos archivos. Actualiza también
`scripts/deploy/control.py` en Ubuntu. No basta con actualizar el script del servidor.

### Publicar otra versión

Para publicar cambios de la aplicación, repite los pasos 2 y 3 con una etiqueta
nueva (por ejemplo, `v1.0.1`). No necesitas obtener de nuevo el certificado en cada
despliegue; conserva su renovación periódica.

Antes de desplegar, actualiza también la copia del repositorio de Ubuntu cuando
cambien `deploy.sh`, `scripts/deploy`, Compose o Nginx. Revisa primero
`git status --short`; si sigues la rama de despliegue y no hay cambios locales,
usa `git pull --ff-only`. Conserva `.env`, `private`, `.deploy` y el nombre del
proyecto Compose. El comando de despliegue no descarga estos archivos desde Git.

```bash
bash deploy.sh status     # Ver qué versión está activa
bash deploy.sh rollback   # Volver a la anterior disponible
bash deploy.sh recover    # Revisar una ejecución interrumpida antes de repetir
```

Si falló una migración, `recover` exige que su historial esté resuelto: no vuelve
a aplicar SQL a ciegas. Diagnostica con Prisma antes de reintentar. Nunca uses
`migrate reset` para recuperar un despliegue.

Para certificados, conserva tu programación habitual de `renew-certs.sh`.
Usa el mismo bloqueo y recarga Nginx solo después de comprobar la configuración.

### Programar la renovación en una instalación nueva

El repositorio incluye el comando de renovación, pero no instala una tarea
periódica. Compruébalo manualmente en Ubuntu:

```bash
bash renew-certs.sh
```

Si aún no tienes renovación programada, abre `crontab -e` con el usuario que
ejecuta Docker y añade una entrada como esta, sustituyendo la ruta por la real:

```cron
17 3,15 * * * cd /opt/template-project-nextjs && /bin/bash renew-certs.sh >> "$HOME/renew-certs.log" 2>&1
```

Comprueba con `crontab -l` que quedó guardada y revisa el log después de su primera
ejecución. Certbot comprueba si corresponde renovar; no emite un certificado nuevo
en cada llamada. Mantén disponible el puerto 80 para los desafíos y programa la
renovación fuera de tus despliegues: comparten bloqueo. Si ya existe una tarea
equivalente, conserva esa y no dupliques la programación.

## Diagnóstico de problemas frecuentes

| Síntoma | Qué revisar y siguiente paso |
| --- | --- |
| Prisma no conecta desde Windows | Usa `DB_HOST=localhost`, verifica el puerto publicado y que PostgreSQL acepte conexiones. |
| Prisma no conecta desde Docker | Usa `db:5432` en `DATABASE_URL` y comprueba que las credenciales coincidan con la base. |
| Cambiar `DB_PASSWORD` no cambia la contraseña de la base | Las variables de PostgreSQL inicializan un volumen nuevo; no modifican usuarios de un volumen existente. Conserva las credenciales válidas o planifica el cambio en la base; no borres el volumen. |
| `/api/health` responde, pero `/api/health/ready` devuelve 503 | Revisa migraciones, PostgreSQL y permisos de `private`. Que Next.js responda no basta para estar listo. |
| No llegan correos o falla OAuth | Revisa las variables de la integración, remitente y URL de retorno del entorno. |
| El script de Windows rechaza la construcción | Revisa `git status --short`, confirma los cambios previstos y usa una etiqueta distinta de `latest`. |
| Ubuntu no puede descargar la imagen | Confirma usuario/repositorio/etiqueta, que el push terminó y que Docker tiene acceso al registro. |
| Falla la emisión del certificado | Revisa DNS, acceso externo por puerto 80 y logs de Nginx; la primera instalación permanece en mantenimiento hasta publicar la imagen. |
| Hay una ejecución pendiente | Consulta `status` y usa `recover`; si hubo una migración fallida, resuelve primero su historial. |
| No hay versión anterior para rollback | En el primer despliegue no existe una versión previa; consulta el estado antes de intentar volver atrás. |

En Ubuntu, desde la carpeta de despliegue, estos comandos permiten consultar el
estado sin modificarlo:

```bash
bash deploy.sh status
docker compose -f compose.prod.yml ps -a
docker compose -f compose.prod.yml logs --tail=100 db nginx
docker compose -f compose.prod.yml logs --tail=100 blue green
```

Consulta ambos slots porque la versión activa puede ser cualquiera. Revisa los
logs antes de compartirlos y elimina cualquier información sensible. No ejecutes
`docker compose config` sin `--quiet` para compartir su salida: puede expandir
las credenciales de `.env`.

## Qué archivos intervienen

| Archivo | Función |
| --- | --- |
| `Dockerfile` | Construye la imagen con Next.js y Prisma. |
| `compose.prod.yml` | PostgreSQL, Nginx y las dos aplicaciones: Blue y Green. |
| `deploy.sh` | El único comando de despliegue. |
| `scripts/deploy/control.py` | Lógica interna del comando; no necesitas configurarlo. |
| `docker/www/production/nginx.conf*` | Configuración del proxy y plantilla para elegir versión. |
| `compose.cert.yml`, `renew-certs.sh` | Obtención y renovación de certificados. |

`/api/health` confirma que Next.js responde. `/api/health/ready` comprueba la base
y los archivos privados. `test_control.py` verifica fallos y recuperación.

## Límites que debes conservar

- Mantén las migraciones compatibles con ambas versiones. Añade primero campos
  compatibles; realiza backfills por lotes, reanudables e idempotentes; elimina
  lo antiguo en un despliegue posterior. Comprueba resultados antes de cambiar
  lecturas. Volver a una imagen anterior **no revierte la base ni los datos**.
- Antes de cambios de datos, conserva backups de PostgreSQL y `private` fuera
  del servidor y prueba su restauración en un entorno aislado.
- No cambies el secreto de autenticación durante el cambio de versión. Los
  archivos privados siguen fuera de `public` y requieren una sesión para descargarse.
- Se conservan los JS/CSS de versiones anteriores. Una pestaña con un formulario
  de una versión antigua puede necesitar recarga: no se garantiza compatibilidad
  automática de Server Actions entre compilaciones.
- Evita el corte por esperar el arranque de una imagen. No cubre caídas del
  servidor, migraciones con bloqueos largos ni solicitudes de más de 60 segundos.
- Los assets e imágenes antiguos no se podan automáticamente. Revisa el espacio
  periódicamente y conserva las versiones que necesites para recuperarte.

## GitHub Actions (opcional)

Puedes seguir publicando y desplegando manualmente. `ci.yml` valida el proyecto.
`deploy.yml` permite introducir la misma imagen en **Actions → Desplegar imagen**;
no publica imágenes ni despliega al hacer push.

Para usar ese botón, configura `DEPLOY_ENABLED=true` como variable del repositorio.
En el entorno `production`, configura la variable `DEPLOY_PATH` con la carpeta del
repositorio en el servidor, y los secretos `DEPLOY_HOST`, `DEPLOY_USER`,
`DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` y, si no es 22, `DEPLOY_PORT`. Verifica la
huella SSH por un canal confiable. El servidor debe tener el código de despliegue
actualizado; este workflow solo ejecuta allí el comando.

## Verificar sin producción

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
python3 -m unittest discover -s scripts/deploy -p 'test_*.py' -v
```

Ensaya en otra VM/carpeta con `.env`, datos y volúmenes exclusivos: despliega A,
después B mientras consultas la URL, y prueba rollback. Una imagen con readiness
fallida debe dejar A activa. Comprueba una sesión y un archivo privado durante
el cambio. No uses datos de producción para estas pruebas.

## Observabilidad y logs

La aplicación emite logs estructurados en JSON a `stdout`/`stderr` mediante
Pino. Los errores incluyen un `event` estable, `feature`, `operation` y un
`requestId` para correlacionar una petición entre capas. Next.js, las Server
Actions, Auth.js, las rutas API y los errores no controlados del navegador están
instrumentados.

Configura `LOG_LEVEL` (`debug`, `info`, `warn` o `error`) y
`LOG_SERVICE_NAME` en el entorno. Los archivos Compose de desarrollo, producción
y certificados usan el controlador `local` de Docker con rotación: cinco archivos
de 20 MB por contenedor y compresión de los archivos rotados. Docker administra
estos archivos en el host; la aplicación no necesita una carpeta de logs ni un
volumen adicional. El límite es por contenedor, no por proyecto ni por días.

Consulta los logs a través de Docker, sin editar sus archivos internos:

```bash
docker compose -f compose.prod.yml logs --tail=100 --follow blue green
docker compose -f compose.prod.yml logs --since=1h --tail=200 db nginx
docker compose -f compose.dev.yml logs --tail=100 --follow app
```

Esta configuración se aplica al crear contenedores. En instalaciones existentes,
la candidata la incorporará en el siguiente `bash deploy.sh imagen:version`.
Los contenedores existentes de PostgreSQL y Nginx conservan su configuración de
logging hasta su recreación en una ventana de mantenimiento; el despliegue no
los recrea para aplicar este cambio. No borres volúmenes ni ejecutes `down -v`.

La rotación elimina los registros más antiguos y eliminar un contenedor elimina
sus logs locales. Para conservar historial entre despliegues Blue-Green, envía
los registros a una plataforma de observabilidad independiente antes de eliminar
los contenedores y define allí la retención y las alertas. Pino usa niveles
numéricos: `error` corresponde a `50` y `fatal` a `60`.

Los datos sensibles conocidos se redactan automáticamente; al añadir
nuevos logs, registra identificadores técnicos y nunca contraseñas, tokens,
cookies, cabeceras de autorización ni payloads completos.
