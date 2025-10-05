# Dockerfile simple pour Agent Skeleton OSS
FROM node:18-alpine

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Créer le répertoire de travail
WORKDIR /app

# Copier tout le code source d'abord
COPY . .

# Installer les dépendances du projet principal
RUN npm install --omit=dev

# Installer les dépendances du sous-projet orchestrator
RUN cd packages/orchestrator && npm install --omit=dev

# Exposer le port (nécessaire pour Coolify)
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]