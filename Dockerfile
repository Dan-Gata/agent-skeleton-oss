# Dockerfile ultra-simple pour Agent Skeleton OSS
FROM node:18-alpine

WORKDIR /app

# Copier tout le projet
COPY . .

# Installer les dépendances - projet principal
RUN npm install --omit=dev

# Installer les dépendances - orchestrator
RUN cd packages/orchestrator && npm install --omit=dev

# Installer wget pour le health check
RUN apk add --no-cache wget

EXPOSE 3000

# Health check pour Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"]