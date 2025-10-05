# Dockerfile optimisé pour Agent Skeleton OSS
FROM node:18-alpine

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json
COPY package*.json ./
COPY packages/orchestrator/package*.json ./packages/orchestrator/

# Installer les dépendances
RUN npm install --only=production && \
    cd packages/orchestrator && \
    npm install --only=production

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "const http = require('http'); \
    const req = http.request({hostname:'localhost',port:3000,path:'/health',timeout:2000}, (res) => { \
      process.exit(res.statusCode === 200 ? 0 : 1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Commande de démarrage
CMD ["npm", "start"]