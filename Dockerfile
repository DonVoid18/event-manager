# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.14.0
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM deps AS development
COPY . .
RUN pnpm db:generate
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

FROM deps AS build
ENV NODE_ENV=production NEXT_OUTPUT=standalone
ARG RELEASE_ID
ENV RELEASE_ID=${RELEASE_ID}
COPY . .
RUN pnpm db:generate
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
ARG RELEASE_ID
LABEL org.opencontainers.image.revision=${RELEASE_ID}
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Una sola imagen sirve para la app y para ejecutar Prisma de forma puntual.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/src/shared/infrastructure/libs/prisma.ts ./src/shared/infrastructure/libs/prisma.ts
COPY --from=build /app/src/shared/infrastructure/libs/password.ts ./src/shared/infrastructure/libs/password.ts
RUN mkdir -p private .next/cache && chown -R node:node private .next/cache
USER node
EXPOSE 3000
CMD ["node", "server.js"]
