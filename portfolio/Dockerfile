FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/queues/package.json    ./packages/queues/
COPY packages/queues/tsconfig.json   ./packages/queues/tsconfig.json
COPY portfolio/package.json          ./portfolio/

RUN npm ci --workspaces --include=dev

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV PATH="/app/node_modules/.bin:$PATH"

COPY packages/database ./packages/database
COPY packages/queues   ./packages/queues
COPY portfolio         ./portfolio
COPY package.json      ./

# node_modules por último — sobrescreve o que veio do COPY portfolio
COPY --from=deps /app/node_modules           ./node_modules
COPY --from=deps /app/portfolio/node_modules ./portfolio/node_modules

RUN npm run build    --workspace=packages/database
RUN npm run generate --workspace=packages/database
RUN npm run build    --workspace=packages/queues
RUN npm run build    --workspace=portfolio

# ── runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

RUN npm install sharp --ignore-scripts=false

COPY --from=builder --chown=nextjs:nodejs /app/portfolio/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/portfolio/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/portfolio/.next/static     ./.next/static

# Prisma engines
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma       ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma       ./node_modules/@prisma

# React e dependências não rastreadas pelo standalone
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/react             ./node_modules/react
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/react-dom         ./node_modules/react-dom
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/scheduler         ./node_modules/scheduler

RUN chown -R nextjs:nodejs .

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]