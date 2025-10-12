FROM node:20-alpine

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