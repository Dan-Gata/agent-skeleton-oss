# Build pour Agent Skeleton OSS
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste du code source
COPY . .

# Exposer le port
EXPOSE 3000

# Variables d'environnement par défaut
ENV PORT=3000
ENV NODE_ENV=production

# Health check pour Coolify
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application
CMD ["node", "server.js"]
