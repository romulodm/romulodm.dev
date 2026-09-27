FROM node:22-bookworm-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/database/package.json  ./packages/database/
COPY packages/queues/package.json    ./packages/queues/
COPY packages/queues/tsconfig.json   ./packages/queues/tsconfig.json
COPY packages/templates/package.json ./packages/templates/
COPY packages/web3/package.json      ./packages/web3/
COPY worker/package.json             ./worker/

RUN npm ci \
    --workspace=packages/database \
    --workspace=packages/queues \
    --workspace=packages/templates \
    --workspace=packages/web3 \
    --workspace=worker \
    --include-workspace-root

COPY packages/database  ./packages/database
COPY packages/queues    ./packages/queues
COPY packages/templates ./packages/templates
COPY packages/web3      ./packages/web3
COPY worker             ./worker

RUN npm run generate --workspace=packages/database
RUN npm run build    --workspace=packages/database
RUN npm run build    --workspace=packages/queues
RUN npm run build    --workspace=packages/templates
RUN npm run build    --workspace=packages/web3

WORKDIR /app/worker
CMD ["npx", "tsx", "index.ts"]
