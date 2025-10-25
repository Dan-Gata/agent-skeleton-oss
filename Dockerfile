FROM node:20-alpine

# Force rebuild - Cache buster for Coolify
ARG CACHEBUST=d34cca8_force_full_rebuild_v4_20251025
RUN echo "Build triggered at: ${CACHEBUST}"

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ wget

# Copy package files first for better Docker layer caching
COPY package*.json ./
COPY packages/orchestrator/package*.json ./packages/orchestrator/

# Install root dependencies
RUN npm install --omit=dev

# Install orchestrator dependencies
WORKDIR /app/packages/orchestrator
RUN npm install --omit=dev

# Copy the rest of the application
WORKDIR /app
COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"]
