# Copilot instructions for Invoice Builder

Overview
--------
This repository is an Electron app with a separate backend webserver used for the web/docker mode. Key runtime pieces are:
- Electron main process: built by `vite` via `vite.electron.config.ts` -> outputs `dist-be/backend/main/main.cjs`
- Preload script: `src/preload/preload.ts` -> built with `vite.preload.config.ts` -> outputs `dist-be/preload/preload.cjs`
- Renderer (React + Vite): `src/renderer` (dev: `vite`, build: `vite build`)
- Optional backend webserver: `src/backend/webserver/main.ts` (dev: `npm run dev:webserver`, build: `npm run build:webserver`)
- Migrations: source files in `src/backend/shared/migrations`, built into `dist-be/backend/migrations` using `vite.migrations.config.ts`.

BMAD-inspired workflow for agentic development
--------------------------------------------
This repository uses a lightweight BMAD-style workflow for coding tasks. See [AGENTS.md](../AGENTS.md) for the complete workflow guide, including when to use this workflow, default verification checks, and team expectations.

For new work with the agent-based approach:
- Use the `po` agent with [bmad-po.prompt.md](.github/prompts/bmad-po.prompt.md) for acceptance criteria and scope clarification.
- Use the `dev` agent with [bmad-dev.prompt.md](.github/prompts/bmad-dev.prompt.md) for implementation.
- Use the `qa` agent with [bmad-qa.prompt.md](.github/prompts/bmad-qa.prompt.md) for review and verification.
- Use the `delivery` agent with [bmad-delivery.prompt.md](.github/prompts/bmad-delivery.prompt.md) for slicing and sequencing release work.
- Use the `scrum` agent with [bmad-scrum.prompt.md](.github/prompts/bmad-scrum.prompt.md) for sprint planning and execution cadence.

Repository-specific expectations:
- UI work usually touches `src/renderer`.
- IPC or preload changes require matching updates in `src/preload/preload.ts` and the Electron main process under `src/backend/main`.
- Database or persistence changes should be reviewed for migrations under `src/backend/shared/migrations`.
- Webserver changes should be validated through the appropriate build or dev workflow.

Primary developer commands
--------------------------
- Full local dev (electron + renderer + preload + migrations):
  - `npm run dev`
- Frontend-only dev: `npm run dev:react` (uses Vite)
- Backend webserver dev: `npm run dev:webserver` (runs `src/backend/webserver/main.ts` via `tsx`)
- Build production bundles: `npm run build` (runs `build:react`, `build:preload`, `build:migrations`, `build:electron`)
- Package for Windows: `npm run package` (calls `electron-builder`)
- Tests: `npm test` (runs `vitest`), coverage: `npm run test:coverage`

Important patterns and conventions
--------------------------------
- Multi-config Vite builds: see `vite.electron.config.ts`, `vite.preload.config.ts`, and `vite.migrations.config.ts`. When adding runtime files for main/preload/migrations, update those configs.
- IPC surface is declared in `src/preload/preload.ts` as `window.electronAPI`. When adding or renaming IPC channels:
  - Add/remove the `ipcMain` handlers in the Electron main process (src/backend/main)
  - Mirror the channel name and typings in `src/preload/preload.ts` and update related renderer types under `src/renderer/shared/types`
  - Keep the exposed function names stable (renderer code expects methods like `electronAPI.getAllInvoices`, `electronAPI.addInvoice`).
- Web vs Electron mode:
  - Renderer detects runtime via `isWebMode()` (see `src/renderer/shared/api/restApi`) and either calls the web API or talks to `window.electronAPI`.
  - Mocking: MSW is enabled via `VITE_ENABLE_MOCKS` (set in `.env.*`), and the renderer starts the worker in `src/renderer/main.tsx`.
- Database & migrations:
  - Migrations live in `src/backend/shared/migrations` and are built into `dist-be/backend/migrations`. Use `npm run build:migrations` for CI packaging.
  - The app uses SQLite (`sqlite3`). Be careful when changing schema—migrations need to run in a controlled order.

Files to inspect for changes
----------------------------
- Electron main entry: `src/backend/main/main.ts` (built via `vite.electron.config.ts`)
- Preload: `src/preload/preload.ts` (exposes `electronAPI`)
- Renderer entry: `src/renderer/main.tsx` and `src/renderer/app/*`
- Webserver: `src/backend/webserver/main.ts`
- Vite configs: `vite.electron.config.ts`, `vite.preload.config.ts`, `vite.migrations.config.ts`, `vite.config.ts`
- Package scripts in `package.json` (many composite scripts use `concurrently`, `wait-on`, and `electronmon`)

Practical tips for changes
--------------------------
- Small, focused PRs: prefer narrow changes (one feature/bug per PR). CI builds multiple Vite targets, which can be slow.
- When adding IPC channels, update types in `src/renderer/shared/types` and ensure the preload exposes matching functions.
- To run the Electron dev loop locally, use `npm run dev`; it runs multiple watchers and `wait-on` to coordinate start order.
- If you touch packaging or `electron-builder` config, ask for a human review before merging (release artifacts are sensitive).

Commit and PR etiquette
----------------------
- Use conventional prefixes: `feat:`, `fix:`, `chore:`, `docs:`. Keep subject short.
- Include which platform you tested on if the change touches OS-specific code (Windows/Linux/macOS).

When to ask a human
-------------------
- Changes to packaging, CI, or release steps.
- Database schema changes that require migration strategy.
- Large refactors affecting both main, preload, and renderer code.

Contact
-------
Open a draft PR or an issue describing the intended change and runtime verification steps; maintainers prefer small iterative changes.
