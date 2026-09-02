# Build context is the REPO ROOT, not this directory:
#   docker build -f backend/Dockerfile .
# The backend shares ../shared and ../mockdata with the web and mobile apps,
# the same way web/tsconfig.app.json includes them.
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json backend/
RUN cd backend && npm ci
COPY shared/ shared/
COPY mockdata/ mockdata/
COPY backend/ backend/
RUN cd backend && npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
# Kept so `npm run seed` can be executed against a fresh database.
COPY --from=build /app/mockdata ./mockdata
COPY --from=build /app/shared ./shared
USER node
EXPOSE 3000

FROM runtime AS api
CMD ["node", "dist/server.js"]

# Same image, different entrypoint — the two can never drift apart on
# dependency versions.
FROM runtime AS worker
CMD ["node", "dist/worker.js"]
