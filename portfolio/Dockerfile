# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Raiz
COPY package.json package-lock.json ./

# Todos os packages que o portfolio depende
COPY packages/database/package.json            ./packages/database/
COPY packages/queues/package.json              ./packages/queues/
COPY packages/queues/tsconfig.json             ./packages/queues/
COPY packages/templates/package.json           ./packages/templates/
COPY packages/web3/package.json                ./packages/web3/
COPY portfolio/package.json                    ./portfolio/

RUN npm ci \
    --workspace=packages/database \
    --workspace=packages/queues \
    --workspace=packages/templates \
    --workspace=packages/web3 \
    --workspace=portfolio \
    --include-workspace-root

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV PATH="/app/node_modules/.bin:$PATH"

ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_SITE_NAME=""
ARG NEXT_PUBLIC_SITE_DESCRIPTION=""
ARG NEXT_PUBLIC_APP_NAME=""
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID=""
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
ARG NEXT_PUBLIC_WALLET_ADDRESS=""
ARG NEXT_PUBLIC_ENCRYPTION_PUBLIC_KEY=""

ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
ARG NEXT_PUBLIC_TERMINAL_SECRET_PASSWORD=""
ARG NEXT_PUBLIC_TERMINAL_SECRET_REWARD=""

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_SITE_DESCRIPTION=$NEXT_PUBLIC_SITE_DESCRIPTION
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_WALLET_ADDRESS=$NEXT_PUBLIC_WALLET_ADDRESS
ENV NEXT_PUBLIC_ENCRYPTION_PUBLIC_KEY=$NEXT_PUBLIC_ENCRYPTION_PUBLIC_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TERMINAL_SECRET_PASSWORD=$NEXT_PUBLIC_TERMINAL_SECRET_PASSWORD
ENV NEXT_PUBLIC_TERMINAL_SECRET_REWARD=$NEXT_PUBLIC_TERMINAL_SECRET_REWARD

ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"
ARG NEXT_PUBLIC_SENTRY_RELEASE=""
ARG NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=""
ARG SENTRY_ORG=""
ARG SENTRY_PROJECT=""

ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT
ENV NEXT_PUBLIC_SENTRY_RELEASE=$NEXT_PUBLIC_SENTRY_RELEASE
ENV NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=$NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT

COPY package.json package-lock.json ./

# Pacotes internos — na ordem de dependência
COPY packages/database   ./packages/database
COPY packages/queues     ./packages/queues
COPY packages/templates  ./packages/templates
COPY packages/web3       ./packages/web3
COPY portfolio           ./portfolio

COPY --from=deps /app/node_modules            ./node_modules
COPY --from=deps /app/portfolio/node_modules  ./portfolio/node_modules

# Build na ordem correta (deps antes do consumer)
RUN npm run build:database   # generate + build do Prisma
RUN npm run build:queues
RUN npm run build:templates
RUN npm run build:web3
# O token entra por tmpfs em /run/secrets, visivel so durante este RUN e ausente
# da imagem resultante. `required=false`: sem o secret, o next.config.js ve
# SENTRY_AUTH_TOKEN vazio e desliga o upload de source maps — o build segue igual.
RUN --mount=type=secret,id=sentry_auth_token,required=false \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" \
    npm run build:portfolio

# ── migrator ──────────────────────────────────────────────────────────────────
# Imagem separada, so para rodar `prisma migrate deploy` antes de a app subir.
#
# POR QUE NAO REAPROVEITAR A IMAGEM DA APP:
# o `runner` abaixo copia apenas os engines do Prisma (.prisma e @prisma), nao
# a CLI nem a pasta de migrations. Rodar migration a partir dele falharia com
# "prisma: not found" — e uma imagem de producao nao deve mesmo carregar a CLI.
#
# Ela e versionada pelo mesmo SHA das outras. Assim a migration que roda e
# exatamente a que veio com aquele commit, e o rollback de tag leva o schema
# junto em vez de deixar o banco a frente do codigo.
FROM base AS migrator
WORKDIR /app

# A CLI `prisma` e devDependency de packages/database, e o `npm ci` do estagio
# `deps` nao usa --omit=dev — logo ela existe no node_modules do builder.
COPY --from=builder /app/node_modules      ./node_modules
COPY --from=builder /app/packages/database ./packages/database

WORKDIR /app/packages/database

# `migrate deploy` (e nao `migrate dev`): aplica migrations pendentes, nunca
# gera nem apaga nada, e falha se encontrar drift. E o unico modo seguro para
# rodar sem supervisao.
CMD ["npx", "prisma", "migrate", "deploy"]

# ── runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# Standalone (inclui react/react-dom se outputFileTracingRoot estiver correto)
COPY --from=builder --chown=nextjs:nodejs /app/portfolio/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/portfolio/public           ./portfolio/public
COPY --from=builder --chown=nextjs:nodejs /app/portfolio/.next/static     ./portfolio/.next/static

# Prisma engines
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma       ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma       ./node_modules/@prisma

# Sharp — copiado do builder, sem instalar no runner
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp         ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img          ./node_modules/@img

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "portfolio/server.js"]