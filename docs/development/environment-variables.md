---
title: Environment Variables
---

# Environment Variables

## Frontend

Frontend variables are loaded by Vite from `.env.development`, `.env.production`, or `.env.test`. They are embedded in the frontend bundle at build time and are visible to browser users, so never use `VITE_*` variables for secrets.

| Variable            | Default        | Description                                                                                                |
| ------------------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`      | Browser origin | Backend origin for web mode. Standard Docker deployments use the nginx proxy and should leave this unset. |
| `VITE_ENABLE_MOCKS` | `false`        | Starts the MSW browser worker when set to `true`.                                                         |

Frontend defaults and `VITE_*` access are centralized in `apps/renderer/src/config.ts`.

## Backend

Backend variables are read at runtime. Electron loads the root `.env` file; the direct webserver inherits variables from its shell or process manager; Docker Compose passes variables to the backend container.

| Variable         | Default                   | Description                                                            |
| ---------------- | -------------------------- | ----------------------------------------------------------------------- |
| `FE_SERVER_URL`  | `http://127.0.0.1:5173`   | Electron development URL and allowed webserver CORS origin.            |
| `USERPROFILE`    | Current working directory | Default directory for Electron file dialogs; normally set by Windows. |
| `DEV_SERVER_URL` | `127.0.0.1`               | Address on which the backend webserver listens.                        |
| `PORT`           | `3000`                    | Backend webserver port.                                                |

Backend defaults and parsing are centralized in `packages/core/src/config.ts`.

For `NODE_ENV`, PostgreSQL pool tuning, webserver session lifecycle, and Docker-only variables, see the [Self-Hosting (Docker)](../installation/docker.md#deployment-environment-variables) deployment environment variables.
