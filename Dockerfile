# Dockerfile optimisé pour Agent Skeleton OSS
FROM node:18-alpine

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json
COPY package*.json ./
COPY packages/orchestrator/package*.json ./packages/orchestrator/

# Installer les dépendances
RUN npm ci --only=production && \
    cd packages/orchestrator && \
    npm ci --only=production && \
    npm cache clean --force

# Copier le code source
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Commande de démarrage
CMD ["npm", "start"]