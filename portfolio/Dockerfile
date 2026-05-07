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
RUN npm run build:portfolio

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