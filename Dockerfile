# Agent Skeleton OSS - Dockerfile pour Coolify
FROM node:18-alpine

# Métadonnées
LABEL maintainer="Agent Skeleton OSS"
LABEL description="Assistant IA intelligent avec intégrations n8n/Coolify/Baserow"

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Créer le répertoire de l'application
WORKDIR /app

# Installer les dépendances système
RUN apk add --no-cache \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Copier les fichiers package.json
COPY package*.json ./
COPY packages/orchestrator/package*.json ./packages/orchestrator/

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Changer la propriété des fichiers
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exposer le port
EXPOSE 3000

# Point d'entrée
WORKDIR /app/packages/orchestrator
CMD ["node", "src/index.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1