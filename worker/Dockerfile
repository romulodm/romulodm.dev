FROM node:22-bookworm-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/queues/package.json ./packages/queues/
COPY packages/queues/tsconfig.json ./packages/queues/tsconfig.json
COPY worker/package.json ./worker/

RUN npm install --workspaces --include=dev

COPY packages/database ./packages/database
COPY packages/queues ./packages/queues
COPY worker ./worker

RUN npm run build --workspace=packages/database
RUN npm run generate --workspace=packages/database
RUN npm run build --workspace=packages/queues

WORKDIR /app/worker
CMD ["npx", "tsx", "index.ts"]