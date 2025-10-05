# Dockerfile ultra-simple pour Agent Skeleton OSS
FROM node:18-alpine

WORKDIR /app

# Copier tout le projet
COPY . .

# Installer les dépendances - projet principal
RUN npm install --omit=dev

# Installer les dépendances - orchestrator
RUN cd packages/orchestrator && npm install --omit=dev

EXPOSE 3000

CMD ["npm", "start"]