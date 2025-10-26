FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ wget curl

# Copy package files first (better caching)
COPY package*.json ./
COPY packages/orchestrator/package*.json ./packages/orchestrator/

# Install dependencies
RUN npm install --omit=dev && \
    cd packages/orchestrator && \
    npm install --omit=dev

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
