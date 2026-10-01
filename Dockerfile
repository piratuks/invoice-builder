FROM node:20-alpine AS builder
WORKDIR /app


COPY package.json package-lock.json* ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/core/package.json ./packages/core/
COPY apps/renderer/package.json ./apps/renderer/
COPY apps/server/package.json ./apps/server/
RUN npm ci --workspace @invoice-builder/renderer --workspace @invoice-builder/server

COPY . .

# VITE_API_URL is no longer required for Docker (nginx proxies /api/* internally).
# It is kept as an optional build arg for non-Docker / custom deployments only.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build:react
RUN npm run build:webserver
RUN npm run build:migrations

FROM node:20-alpine AS runner
WORKDIR /app

# nginx serves the static frontend and proxies /api/* to the backend;
# gettext provides envsubst to template the nginx config at startup.
RUN apk add --no-cache nginx gettext

COPY --from=builder /app/dist-fe /app/dist-fe
COPY --from=builder /app/dist-server /app/dist-server
COPY --from=builder /app/dist-migrations /app/dist-migrations
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/contracts/package.json /app/packages/contracts/package.json
COPY --from=builder /app/packages/contracts/dist /app/packages/contracts/dist
COPY --from=builder /app/packages/core/package.json /app/packages/core/package.json
COPY --from=builder /app/packages/core/dist /app/packages/core/dist
COPY --from=builder /app/apps/server/package.json /app/apps/server/package.json

# Install only the server workspace and its runtime dependency graph.
RUN npm ci --omit=dev --workspace @invoice-builder/server

EXPOSE 3000 3001

COPY scripts/docker-start.sh /app/scripts/docker-start.sh
COPY scripts/nginx.conf.template /app/scripts/nginx.conf.template
RUN sed -i 's/\r$//' /app/scripts/docker-start.sh \
    && chmod +x /app/scripts/docker-start.sh

VOLUME ["/app-data"]

CMD ["/app/scripts/docker-start.sh"]
