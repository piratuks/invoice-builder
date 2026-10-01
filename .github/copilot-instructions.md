# Copilot instructions for Invoice Builder

Overview
--------
This repository is an Electron app with a separate backend webserver used for the web/docker mode. Key runtime pieces are:
- Electron main process: `apps/desktop/main` built by `apps/desktop/vite.main.config.ts` -> outputs `dist-desktop/main/main.cjs`
- Preload script: `apps/desktop/preload/preload.ts` built with `apps/desktop/vite.preload.config.ts` -> outputs `dist-desktop/preload/preload.cjs`
- Renderer (React + Vite): `apps/renderer/src` (dev: `npm run dev:renderer`, build: `npm run build:renderer`)
- Optional backend webserver: `apps/server/main.ts` (dev: `npm run dev:webserver`, build: `npm run build:webserver` -> `dist-server/main.js`)
- Migrations: source files in `packages/core/src/migrations`, built into `dist-migrations` using `vite.migrations.config.ts`.

BMAD-inspired workflow for agentic development
--------------------------------------------
This repository uses a lightweight BMAD-style workflow for coding tasks. See [AGENTS.md](../AGENTS.md) for the complete workflow guide, including when to use this workflow, default verification checks, and team expectations.

For new work with the agent-based approach:
- Use the `po` agent with [bmad-po.prompt.md](prompts/bmad-po.prompt.md) for acceptance criteria and scope clarification.
- Use the `dev` agent with [bmad-dev.prompt.md](prompts/bmad-dev.prompt.md) for implementation.
- Use the `qa` agent with [bmad-qa.prompt.md](prompts/bmad-qa.prompt.md) for review and verification.
- Use the `delivery` agent with [bmad-delivery.prompt.md](prompts/bmad-delivery.prompt.md) for slicing and sequencing release work.
- Use the `scrum` agent with [bmad-scrum.prompt.md](prompts/bmad-scrum.prompt.md) for sprint planning and execution cadence.

Repository-specific expectations:
- UI work usually touches `apps/renderer/src`.
- IPC or preload changes require matching updates in `apps/desktop/preload/preload.ts` and the Electron main process under `apps/desktop/main`.
- Database or persistence changes should be reviewed for migrations under `packages/core/src/migrations`.
- Webserver changes should be validated through the appropriate build or dev workflow.

Primary developer commands
--------------------------
- Full local dev (electron + renderer + preload + migrations):
  - `npm run dev:desktop`
- Frontend-only dev: `npm run dev:renderer` (uses Vite)
- Backend webserver dev: `npm run dev:webserver` (watches contracts, core, and migrations, then runs `apps/server/main.ts` via `tsx`)
- Build all desktop production bundles: `npm run build:desktop:all` (runs `build:core`, `build:renderer`, `build:migrations`, and `build:desktop`)
- Package for Windows: `npm run release:win` (calls `electron-builder`)
- Tests: `npm test` (runs `vitest`), coverage: `npm run test:coverage`

Important patterns and conventions
--------------------------------
- Multi-config Vite builds: see `apps/desktop/vite.main.config.ts`, `apps/desktop/vite.preload.config.ts`, and `vite.migrations.config.ts`. When adding runtime files for main/preload/migrations, update those configs.
- IPC surface is declared in `apps/desktop/preload/preload.ts` as `window.electronAPI`. When adding or renaming IPC channels:
  - Add/remove the `ipcMain` handlers in the Electron main process (apps/desktop/main)
  - Mirror the channel name and typings in `apps/desktop/preload/preload.ts` and update shared DTOs/enums in `packages/contracts` (`@invoice-builder/contracts`)
  - Keep the exposed function names stable (renderer code expects methods like `electronAPI.getAllInvoices`, `electronAPI.addInvoice`).
- Web vs Electron mode:
  - Renderer detects runtime via `isWebMode()` (see `apps/renderer/src/shared/api/restApi`) and either calls the web API or talks to `window.electronAPI`.
  - Mocking: MSW is enabled via `VITE_ENABLE_MOCKS` (set in `.env.*`), and the renderer starts the worker in `apps/renderer/src/main.tsx`.
- Contracts:
  - `packages/contracts` owns public DTOs, shared enums, and the Electron IPC contract.
  - Vite bundles contracts source for Electron and renderer targets; the plain TypeScript webserver consumes its compiled CommonJS output.
- Core:
  - `packages/core` owns shared backend services, database infrastructure, utilities, and migrations.
  - Both Electron and the webserver consume core through `@invoice-builder/core` subpath imports.
- Database & migrations:
  - Migrations live in `packages/core/src/migrations` and are built into `dist-migrations`. Use `npm run build:migrations` for CI packaging.
  - The app uses SQLite (`sqlite3`). Be careful when changing schema—migrations need to run in a controlled order.

Files to inspect for changes
----------------------------
- Electron main entry: `apps/desktop/main/main.ts` (built via `apps/desktop/vite.main.config.ts`)
- Preload: `apps/desktop/preload/preload.ts` (exposes `electronAPI`)
- Renderer entry: `apps/renderer/src/main.tsx` and `apps/renderer/src/app/*`
- Webserver: `apps/server/main.ts`
- Vite configs: `apps/renderer/vite.config.ts`, `apps/desktop/vite.main.config.ts`, `apps/desktop/vite.preload.config.ts`, `vite.migrations.config.ts`; repository tests use `vitest.config.ts`.
- Package scripts in `package.json` (many composite scripts use `concurrently`, `wait-on`, and `electronmon`)

Practical tips for changes
--------------------------
- Small, focused PRs: prefer narrow changes (one feature/bug per PR). CI builds multiple Vite targets, which can be slow.
- When adding IPC channels, update DTOs in `packages/contracts` and ensure the preload exposes matching functions. Backend-only DB row types live in `packages/core/src/types` and derive from contracts.
- To run the Electron dev loop locally, use `npm run dev:desktop`; it runs multiple watchers and `wait-on` to coordinate start order.
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
