FROM node:22-alpine AS base
WORKDIR /app

# Copia manifests do workspace inteiro
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY worker/package.json ./worker/

# Instala todas as dependências (resolve workspace links)
RUN npm install --workspaces

# Copia o código-fonte
COPY packages/database ./packages/database
COPY worker ./worker

# Gera o Prisma client e builda o pacote database
RUN npm run build --workspace=packages/database
RUN npm run generate --workspace=packages/database

# Roda o worker
WORKDIR /app/worker
CMD ["node", "--import", "tsx/esm", "index.ts"]