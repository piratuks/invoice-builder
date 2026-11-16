---
title: Project Structure
---

# Project Structure

```bash
apps/
  desktop/             Electron runtime workspace
    main/              Main process, IPC handlers, and desktop database setup
    preload/           Secure renderer-to-main bridge
    vite.*.config.ts   Main and preload bundle configuration
    electron-builder.yml
  renderer/            React and Vite renderer workspace
    src/
      app/             Application shell and navigation
      pages/           Feature pages
      shared/          APIs, components, hooks, utilities, and types
      state/           Redux state
      i18n/            Translation resources
      mocks/           MSW test and development mocks
  server/              Express webserver workspace
    controllers/       HTTP request handlers
    utils/             Webserver utilities
  website/             Docusaurus documentation site workspace
    docusaurus.config.ts  Site config, navbar, and footer
    sidebars.ts            Docs sidebar structure (sources repo-root docs/)
    src/                   Custom pages and components
    static/                Static assets

packages/
  contracts/           Shared DTOs, enums, and Electron IPC contracts
  pdf/                 Shared React-PDF invoice document and rendering package
    src/
      components/      Invoice PDF document, layout, and presentation components
      runtime/         Browser/Node entry points, font registration, and rendering
      types.ts         Prepared, renderer-independent PDF input contract
      *Functions.ts    Shared invoice calculations and formatting helpers
    assets/            Built-in Roboto and Inter fonts
  core/                Shared backend and persistence workspace
    src/
      db/              Database adapters and schema setup
      migrations/      Versioned TypeScript migrations
      services/        Business services
      types/           Backend-only types
      utils/           Shared backend utilities

e2e/                   Desktop and web end-to-end tests
docs/                  User documentation and tutorial assets (rendered by apps/website)
scripts/               Build, Docker, and maintenance scripts

dist-renderer/         Generated renderer bundle
dist-desktop/          Generated Electron main and preload bundles
dist-server/           Generated webserver bundle
dist-website/          Generated documentation site bundle
dist-migrations/       Generated migration modules
```

The renderer prepares invoice data, settings, translated/custom labels, and inline
data-URL assets before calling `@invoice-builder/pdf`. The shared package owns the
PDF document, layout/presentation, and built-in fonts; its browser and Node entry
points use the same prepared input. The Node entry point returns PDF bytes for
backend callers to persist or attach. Keep UI state, database access, translation
hooks, DOM APIs, and host-specific file handling outside the PDF package.

Build the package with `npm run build -w @invoice-builder/pdf`. The root
`build:renderer`, `dev:renderer`, `dev:desktop`, and `test` workflows build it as
needed before consuming it.
