---
title: Self-Hosting (Docker)
---

# Self-Hosting (Docker)

Invoice Builder can also be self-hosted using Docker for users who prefer running it on their own server or NAS, with centralized access from multiple machines and easy backups via mounted volumes.

This option is ideal if you want:

- Centralized access from multiple machines
- Easy backups via mounted volumes

## Docker Image

A pre-built image is published automatically to GitHub Container Registry on every push to `main` and on every version tag:

```bash
ghcr.io/piratuks/invoice-builder:latest
```

Pull it at any time with:

```bash
docker pull ghcr.io/piratuks/invoice-builder:latest
```

:::info[`VITE_API_URL` is no longer needed for Docker deployments]

The Docker image now uses **nginx** as the frontend server. Nginx proxies all `/api/*` requests
to the backend internally, so the frontend never needs to know the backend's external address.
`VITE_API_URL` is only needed when running the web server outside Docker (e.g. `npm run dev:renderer`, `npm run dev:webserver`).

If you build the image yourself for non-Docker use, you can still pass it:

```bash
docker build --build-arg VITE_API_URL=http://your-host:3000 -t invoice-builder .
```

But for all standard Docker deployments you can omit it entirely.

:::

---

## Option A – Two containers (recommended)

The default setup runs backend and frontend as separate containers from the same image.

```bash
docker compose pull
docker compose up -d
```

| Container  | Port | Role                         |
| ---------- | ---- | ---------------------------- |
| `backend`  | 3000 | Node.js REST API + SQLite/PG |
| `frontend` | 3001 | Static SPA served by nginx   |

---

## Option B – Single container

Run both backend and frontend in one container using `SERVICE=all`:

```bash
docker compose -f docker-compose.standalone.yml up -d
```

| Port | Role                         |
| ---- | ---------------------------- |
| 3000 | Node.js REST API + SQLite/PG |
| 3001 | Static SPA served by nginx   |

## Running without Docker Compose

`docker pull` only downloads the image. To start the single-container image directly, provide the startup service and compiled migration directory:

```bash
docker pull ghcr.io/piratuks/invoice-builder:latest
docker run -d \
  --name invoice-builder \
  -p 3001:3001 \
  -e SERVICE=all \
  -e NODE_ENV=docker \
  -e FE_SERVER_URL=http://localhost:3001 \
  -e MIGRATIONS_PATH=/app/dist-migrations \
  -v invoice-builder-data:/app-data \
  ghcr.io/piratuks/invoice-builder:latest
```

Open `http://localhost:3001` after the container starts. Port `3000` is used internally by nginx and does not need to be published. Add `-p 3000:3000` only when direct access to the backend API is required.

The `SERVICE` and `MIGRATIONS_PATH` values are supplied automatically when using `docker compose`; they are required here because `docker pull` does not apply Compose configuration.

---

## Building locally instead of pulling

If you prefer to build the image from source:

```bash
# Two-container build
docker compose up -d --build
docker compose up -d

# Or single container
docker build -t invoice-builder .
docker compose -f docker-compose.standalone.yml up -d
```

## Deployment environment variables

These variables configure a self-hosted Docker deployment. See the [Environment Variables reference](../development/environment-variables.md) for the full developer-focused variable reference.

| Variable                        | Default           | Description                                                          |
| ------------------------------- | ----------------- | -------------------------------------------------------------------- |
| `NODE_ENV`                      | Unset             | Runtime mode, including `docker`, `production`, and `test`.          |
| `DB_DIRECTORY`                  | `app-data`        | Directory containing webserver SQLite databases.                     |
| `MIGRATIONS_PATH`               | `dist-migrations` | Directory containing compiled migration files.                       |
| `PG_POOL_MAX`                   | `10`              | Maximum PostgreSQL pool size.                                        |
| `PG_POOL_IDLE_TIMEOUT_MS`       | `30000`           | Idle PostgreSQL connection timeout in milliseconds.                  |
| `PG_POOL_CONNECTION_TIMEOUT_MS` | `5000`            | PostgreSQL connection acquisition timeout in milliseconds.           |
| `PG_POOL_MAX_LIFETIME_SECONDS`  | `0`               | Maximum PostgreSQL connection lifetime in seconds; `0` disables it.  |
| `PG_POOL_ALLOW_EXIT_ON_IDLE`    | `false`           | Allows Node.js to exit while all PostgreSQL clients are idle.        |
| `WEBSERVER_CLEANUP_INTERVAL_MS` | `60000`           | Interval between expired-session and inactive-database cleanup runs. |
| `WEBSERVER_SESSION_TTL_MS`      | `1800000`         | Web session inactivity lifetime in milliseconds.                     |
| `SERVICE`                       | Required          | Starts `backend`, `frontend`, or `all` services in the image.        |
| `BACKEND_HOST`                  | `localhost`       | Backend hostname used by the nginx frontend proxy.                   |
| `BACKEND_PORT`                  | `3000`            | Backend port used by the startup health wait and nginx proxy.        |

`SERVICE`, `BACKEND_HOST`, `BACKEND_PORT`, and `MIGRATIONS_PATH` are supplied automatically by the provided Compose files; override the rest through shell variables or a root `.env` file, for example:

```env
PG_POOL_MAX=20
PG_POOL_IDLE_TIMEOUT_MS=45000
WEBSERVER_CLEANUP_INTERVAL_MS=120000
WEBSERVER_SESSION_TTL_MS=3600000
```
