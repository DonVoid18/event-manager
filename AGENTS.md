# Instrucciones para trabajar en este proyecto

## Comunicación y alcance

- Responder en español y explicar brevemente los cambios y su verificación.
- Revisar el código relacionado antes de editar y mantener los cambios enfocados en la tarea.
- Respetar los cambios locales existentes; no descartarlos ni sobrescribir trabajo ajeno.
- Resolver decisiones rutinarias siguiendo las convenciones del proyecto. Consultar cuando falte información que cambie el alcance o el comportamiento esperado.

## Tecnologías y comandos

- Aplicación Next.js con App Router, React y TypeScript en modo estricto.
- Interfaz con Tailwind CSS, shadcn/ui y Lucide; formularios con React Hook Form y Zod.
- Persistencia con Prisma y PostgreSQL; autenticación con Auth.js (next-auth).
- Usar pnpm, según `packageManager` en `package.json`, y mantener `pnpm-lock.yaml`. No generar archivos de bloqueo de npm o Yarn.
- Consultar `package.json` para las versiones y scripts vigentes.

| Comando | Uso |
| --- | --- |
| `pnpm install` | Instalar dependencias |
| `pnpm dev` | Iniciar desarrollo |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm exec tsc --noEmit` | Comprobar tipos |
| `pnpm build` | Compilar la aplicación |
| `pnpm db:generate` | Regenerar el cliente Prisma |
| `pnpm db:migrate:dev` | Crear y aplicar migraciones en desarrollo |

## Organización del código

- `src/app`: rutas, layouts, páginas de entrada y endpoints de Next.js.
- `src/features`: funcionalidades organizadas por dominio. Mantener los tipos y esquemas en `domain`, y las acciones, páginas y componentes en `infrastructure`, siguiendo los ejemplos existentes.
- `src/shared`: código reutilizable, autenticación, cliente Prisma, archivos, logging y componentes comunes.
- `src/shared/infrastructure/shadcn/components/ui`: componentes base de interfaz; reutilizarlos antes de crear equivalentes.
- `prisma`: esquema, migraciones y seed.
- Usar el alias `@/` para imports desde `src` cuando facilite la lectura. Respetar el estilo del archivo editado sin reformatear código ajeno a la tarea.

## Implementación

- Mantener la separación entre servidor y cliente. Añadir `"use client"` cuando sean necesarios hooks, eventos o APIs del navegador; mantener Prisma y secretos en el servidor.
- Reutilizar el cliente Prisma de `src/shared/infrastructure/libs/prisma.ts`.
- Validar entradas en el servidor con los esquemas Zod correspondientes. Comprobar autenticación y permisos en operaciones protegidas, además de cualquier control en la interfaz.
- Conservar los contratos de respuesta de las Server Actions y los mensajes de interfaz en español, salvo que la tarea indique otro idioma.
- Reutilizar los estilos y componentes existentes y conservar navegación por teclado, etiquetas y estados de carga y error.
- Usar las utilidades de logging existentes para errores del servidor, con identificadores técnicos y mensajes seguros para el usuario.

## Datos y configuración

- No incluir contraseñas, tokens, cookies, credenciales ni payloads sensibles en código, logs o respuestas. Documentar nuevas variables en `.env.example` con valores de ejemplo.
- Mantener los archivos privados en `private`, fuera de `public`, y servirlos mediante las rutas autenticadas existentes.
- Para cambios de esquema, actualizar `prisma/schema.prisma` y preparar la migración correspondiente; no reescribir migraciones ya aplicadas.
- Antes de ejecutar migraciones o seeds, comprobar que la base de datos destino corresponde al entorno autorizado para la tarea.
- No ejecutar `db:migrate:reset`, borrar volúmenes o desplegar a producción salvo que la solicitud lo autorice explícitamente.
- Consultar `README.md` para los procedimientos de Docker, almacenamiento privado y certificados.

## Verificación y entrega

- Para cambios de código, ejecutar `pnpm lint` y `pnpm exec tsc --noEmit`. Ejecutar `pnpm build` cuando el cambio afecte rutas, configuración, dependencias o integración entre servidor y cliente.
- Si cambia el esquema Prisma, ejecutar `pnpm exec prisma validate` y regenerar el cliente cuando corresponda.
- Actualmente no hay un script `test` en `package.json`. Verificar el comportamiento afectado con las herramientas disponibles y añadir pruebas cuando aporten cobertura útil, sin introducir un framework por cambios menores.
- Para cambios solo de documentación, revisar contenido y diff; no hace falta compilar.
- Informar qué se verificó y cualquier fallo o limitación del entorno. Distinguir problemas preexistentes de los introducidos por el cambio.

## Despliegue Blue-Green

- Mantener sencillo el uso: un único `.env`, una imagen y `bash deploy.sh imagen:version`. Consultar `README.md`.
- Conservar el arranque de la candidata antes del cambio de Nginx, las comprobaciones de salud, el bloqueo y el rollback verificado.
- No recrear PostgreSQL al actualizar la aplicación ni borrar sus volúmenes. Mantener los archivos privados autenticados y los assets de versiones anteriores.
- Ejecutar migraciones una sola vez y mantener compatibilidad entre ambas versiones. No reintentar migraciones fallidas a ciegas; rollback de aplicación no revierte datos.
- Al cambiar despliegue, ejecutar las pruebas Python, validar Compose, Nginx, shell y workflows con las herramientas disponibles. La aprobación de código no autoriza producción.
