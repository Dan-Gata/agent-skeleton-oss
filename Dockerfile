# Dockerfile optimisé pour Agent Redoutable# Dockerfile optimisé pour Agent Redoutable

# Fix: Node 20+ requis pour better-sqlite3 et pdf-parse# Fix: Node 20+ requis pour better-sqlite3 et pdf-parse

FROM node:20-alpineFROM node:20-alpine



WORKDIR /appWORKDIR /app



# Installer les dépendances système pour compiler better-sqlite3# Installer les dépendances système pour compiler better-sqlite3

# Python et build tools sont requis pour node-gyp# Python et build tools sont requis pour node-gyp

RUN apk add --no-cache \RUN apk add --no-cache \

    python3 \    python3 \

    make \    make \

    g++ \    g++ \

    wget    wget



# Copier TOUT le projet d'abord (sinon packages/orchestrator n'existe pas)# Copier les fichiers package.json d'abord (pour le cache Docker)

COPY . .COPY package*.json ./

COPY packages/orchestrator/package*.json ./packages/orchestrator/

# Installer les dépendances - projet principal

RUN npm install --omit=dev# Installer les dépendances - projet principal

RUN npm install --omit=dev

# Installer les dépendances - orchestrator

WORKDIR /app/packages/orchestrator# Installer les dépendances - orchestrator

RUN npm install --omit=devRUN cd packages/orchestrator && npm install --omit=dev



# Retourner au répertoire principal# Copier le reste du projet

WORKDIR /appCOPY . .



EXPOSE 3000EXPOSE 3000



# Health check pour Coolify# Health check pour Coolify

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \

  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1



CMD ["npm", "start"]CMD ["npm", "start"]

