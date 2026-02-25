FROM node:20-alpine AS builder
WORKDIR /app


COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# VITE_API_URL is no longer required for Docker (nginx proxies /api/* internally).
# It is kept as an optional build arg for non-Docker / custom deployments only.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build:react
RUN npm run build:webserver

FROM node:20-alpine AS runner
WORKDIR /app

# nginx serves the static frontend and proxies /api/* to the backend;
# gettext provides envsubst to template the nginx config at startup.
RUN apk add --no-cache nginx gettext

COPY --from=builder /app/dist-fe /app/dist-fe
COPY --from=builder /app/dist-be /app/dist-be
COPY --from=builder /app/node_modules /app/node_modules

EXPOSE 3000 3001

COPY scripts/docker-start.sh /app/scripts/docker-start.sh
COPY scripts/nginx.conf.template /app/scripts/nginx.conf.template
RUN sed -i 's/\r$//' /app/scripts/docker-start.sh \
    && chmod +x /app/scripts/docker-start.sh

VOLUME ["/data"]

CMD ["/app/scripts/docker-start.sh"]
