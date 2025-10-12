# Dockerfile optimisé pour Agent Redoutable
# Fix: Node 20+ requis pour better-sqlite3 et pdf-parse
FROM node:20-alpine

WORKDIR /app

# Installer les dépendances système pour compiler better-sqlite3
# Python et build tools sont requis pour node-gyp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    wget

# Copier les fichiers package.json d'abord (pour le cache Docker)
COPY package*.json ./
COPY packages/orchestrator/package*.json ./packages/orchestrator/

# Installer les dépendances - projet principal
RUN npm install --omit=dev

# Installer les dépendances - orchestrator
RUN cd packages/orchestrator && npm install --omit=dev

# Copier le reste du projet
COPY . .

EXPOSE 3000

# Health check pour Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"]
