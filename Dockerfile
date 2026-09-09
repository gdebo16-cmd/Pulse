# Pulse — multi-stage production image (Vite client + Express API)
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY client/package.json client/package-lock.json* ./client/
RUN npm install --omit=dev --no-fund --no-audit \
  && npm --prefix client install --no-fund --no-audit

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY . .
RUN npm --prefix client run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/pulse.db
ENV CLIENT_ORIGIN=*
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
RUN npm install --omit=dev --no-fund --no-audit \
  && apt-get purge -y python3 make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
COPY server ./server
COPY --from=build /app/client/dist ./client/dist
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3001
CMD ["sh", "-c", "node server/src/db/init.js && node server/src/index.js"]
