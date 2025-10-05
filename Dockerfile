# Dockerfile simple pour Agent Skeleton OSS
FROM node:18-alpine

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Créer le répertoire de travail
WORKDIR /app

# Copier et installer les dépendances
COPY package*.json ./
RUN npm ci --omit=dev

# Copier les dépendances du sous-projet
COPY packages/orchestrator/package*.json ./packages/orchestrator/
RUN cd packages/orchestrator && npm ci --omit=dev

# Copier le code source
COPY . .

# Exposer le port (nécessaire pour Coolify)
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]