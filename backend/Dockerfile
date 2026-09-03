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

# ---------------------------------------------------------------------------
# Single-service image: API + web + worker in one container.
#
# This is the shape that fits a free tier — one process, one origin. Same
# origin also means the session cookie is first-party, so it survives Safari
# and Chrome's third-party cookie rules, which a split github.io/api deploy
# does not.
#
#   docker build -f backend/Dockerfile --target allinone -t intellicart .
#   docker run -p 3000:3000 --env-file backend/.env intellicart
# ---------------------------------------------------------------------------
FROM node:22-slim AS web
WORKDIR /app
COPY web/package*.json web/
RUN cd web && npm ci
COPY shared/ shared/
COPY mockdata/ mockdata/
COPY web/ web/
# Served from the API root, and the API is same-origin, so both are relative.
ENV VITE_BASE=/
ENV VITE_API_URL=""
RUN cd web && npm run build

FROM runtime AS allinone
COPY --from=web /app/web/dist ./web/dist
ENV SERVE_WEB=true
ENV RUN_WORKER=true
ENV WEB_DIST=./web/dist
CMD ["node", "dist/server.js"]
