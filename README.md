# Invoice Builder

[![Docs](https://img.shields.io/badge/docs-piratuks.github.io-blue?logo=docusaurus&logoColor=white)](https://piratuks.github.io/invoice-builder/)
[![License](https://img.shields.io/github/license/piratuks/invoice-builder)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/piratuks/invoice-builder/total)](https://github.com/piratuks/invoice-builder/releases)
[![Latest Release](https://img.shields.io/github/v/release/piratuks/invoice-builder)](https://github.com/piratuks/invoice-builder/releases)
![Windows](https://img.shields.io/badge/Windows-10%2B-blue?logo=windows)
![Linux](https://img.shields.io/badge/Linux-DEB%20%7C%20AppImage-blue?logo=linux)
![macOS](https://img.shields.io/badge/macOS-DMG-lightgrey?logo=apple&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-blue?style=flat-square&logo=docker&logoColor=white)
[![GHCR](https://img.shields.io/badge/ghcr.io-invoice--builder-blue?style=flat-square&logo=github)](https://github.com/piratuks/invoice-builder/pkgs/container/invoice-builder)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub%20Sponsors-ec5990?logo=github)](https://github.com/sponsors/piratuks)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FF813F?style=flat&logo=buy-me-a-coffee&logoColor=white)](https://www.buymeacoffee.com/evaldizi)

<!-- markdownlint-disable MD033 -->

<a href="https://trendshift.io/repositories/17939?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-17939" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/17939" alt="piratuks%2Finvoice-builder | Trendshift" width="250" height="55"/></a>
<a href="https://trendshift.io/repositories/17939?utm_source=trendshift-badge&amp;utm_medium=badge&amp;utm_campaign=badge-trendshift-17939" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/trendshift/repositories/17939/daily?language=TypeScript" alt="piratuks%2Finvoice-builder | Trendshift" width="250" height="55"/></a>
<!-- markdownlint-enable MD033 -->

Invoice Builder is an **offline-first, open-source invoicing and quoting application** for freelancers and small businesses. No accounts, no cloud, no subscriptions - your data stays on your machine in a database file you own, with an optional self-hosted web/Docker mode for multi-device access.

> **⚠️ One-time upgrade notice for version 3.0.2**
> Before upgrading, back up each existing database and make sure it completed migrations through version 2.10.0. Version 3.0.2 initializes new databases from a consolidated schema and does not include the historical migration chain, so databases with incomplete migrations are not upgraded. This applies to Electron, manual, and web/Docker upgrades.

![Invoice Form](docs/guides/images/invoice_form.jpg)
![Invoice PDF Preview](docs/guides/images/invoice_pdf_preview.jpg)
![Quote PDF Preview](docs/guides/images/quote_pdf_preview.jpg)

## What it does

- Create and manage **Invoices** and **Quotes** with live PDF preview, A4/Letter formats, and a drag-and-drop Visual Layout Builder
- Manage Businesses, Clients, Banks, Items, Categories, Units, and Currencies, each with XLSX import/export
- Flexible financials: surcharges, discounts, shipping, inclusive/exclusive tax, partial payments, and document states
- Export invoices as UBL 2.1 / Peppol BIS Billing 3.0 or XRechnung XML for compliant e-invoicing
- Native receipt printing (desktop) and browser print-to-PDF receipts (web/Docker)
- Full database backup/restore, JSON export/import, and per-document data snapshots for historical accuracy
- Runs as a desktop app (Windows, Linux, macOS) backed by SQLite, or self-hosted via Docker with SQLite or PostgreSQL

## Quick start

**Try the demo:** [Open Invoice Builder in your browser](https://invoice-builder-sha-a014125.onrender.com) without installing anything.

> This public Docker demo runs on Render's free plan and may take a moment to wake up. Use fictional data only: databases may be accessible to other visitors and can disappear without notice. Do not upload real invoices, personal information, or database credentials. This demo is separate from desktop and self-hosted installations, which store data on your own device or configured server.

**Desktop:** download the latest build for your platform from [Releases](https://github.com/piratuks/invoice-builder/releases).

**Docker:**

Install Git and Docker with the Compose plugin, then clone the repository to obtain the Compose file:

```bash
git clone https://github.com/piratuks/invoice-builder.git
cd invoice-builder
docker compose pull
docker compose up -d
```

Then open [http://localhost:3001](http://localhost:3001) in your browser and create or connect a database. See [Quick Start](https://piratuks.github.io/invoice-builder/docs/installation/quick-start/) and [Self-Hosting (Docker)](https://piratuks.github.io/invoice-builder/docs/installation/docker/) for details.

## Documentation

Full documentation is published at [piratuks.github.io/invoice-builder](https://piratuks.github.io/invoice-builder/):

- [Installation](https://piratuks.github.io/invoice-builder/docs/installation/): requirements, desktop install, Docker self-hosting, quick start
- [Guides](https://piratuks.github.io/invoice-builder/docs/guides/): screen-by-screen walkthrough, from database creation to layouts and e-invoices
- [Development](https://piratuks.github.io/invoice-builder/docs/development/): running locally, project structure, core stack, database schema

## Questions and ideas

Bugs and feature requests go in [Issues](https://github.com/piratuks/invoice-builder/issues). Questions and general discussion go in [Discussions](https://github.com/piratuks/invoice-builder/discussions).

## Development

Invoice Builder is an Electron + React app with an optional Node.js webserver, using SQLite or PostgreSQL for storage. See [Running Locally](https://piratuks.github.io/invoice-builder/docs/development/running-locally/) to set up a dev environment, and [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

## License

Invoice Builder is licensed under the [MIT License](LICENSE).

## Support

Invoice Builder is maintained by a single developer. If it saves you time, you can support its development through [GitHub Sponsors](https://github.com/sponsors/piratuks) or [Buy Me a Coffee](https://www.buymeacoffee.com/evaldizi).
