---
title: Running Locally
---

# Running Locally

Clone the repository, install dependencies, and start the development server:

## Electron (Desktop App)

```bash
git clone https://github.com/piratuks/invoice-builder.git
cd invoice-builder
npm install
npm run dev:desktop
```

## Webserver / Browser

```bash
git clone https://github.com/piratuks/invoice-builder.git
cd invoice-builder
npm install
npm run dev:renderer
npm run dev:webserver
```

`npm run dev:webserver` builds the shared workspaces and migrations, then watches contracts, core, and migration changes while running the webserver.
