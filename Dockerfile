FROM node:20-alpine

# Force rebuild - Cache buster for Coolify
ARG CACHEBUST=d34cca8_force_full_rebuild_v3_20251022
RUN echo "Build triggered at: ${CACHEBUST}"

WORKDIR /app

RUN apk add --no-cache python3 make g++ wget

COPY . .

RUN npm install --omit=dev

WORKDIR /app/packages/orchestrator
RUN npm install --omit=dev

WORKDIR /app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"]
