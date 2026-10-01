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
