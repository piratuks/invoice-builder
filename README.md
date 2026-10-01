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

<a href="https://trendshift.io/repositories/17939?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-17939" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/17939" alt="piratuks%2Finvoice-builder | Trendshift" width="250" height="55"/></a>
<a href="https://trendshift.io/repositories/17939?utm_source=trendshift-badge&amp;utm_medium=badge&amp;utm_campaign=badge-trendshift-17939" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/trendshift/repositories/17939/daily?language=TypeScript" alt="piratuks%2Finvoice-builder | Trendshift" width="250" height="55"/></a>

**Offline invoicing with full data ownership.**

**Invoice Builder** is an **offline-first, open-source invoicing and quoting application** for freelancers and small businesses who want full control over their data.

No accounts. No cloud. No subscriptions.  
Your data stays on your machine in a database file you own.

> **⚠️ One-time upgrade notice for version 3.0.2**
> Before upgrading, back up each existing database and make sure it completed migrations through version 2.10.0. Version 3.0.2 initializes new databases from a consolidated schema and does not include the historical migration chain, so databases with incomplete migrations are not upgraded. This applies to Electron, manual, and web/Docker upgrades.

> ☕ **Support Invoice Builder**
> If this project saves you time, you can help keep it maintained through [GitHub Sponsors](https://github.com/sponsors/piratuks) or [Buy Me a Coffee](https://www.buymeacoffee.com/evaldizi).

## 📸 Screenshots

![Invoice Form](docs/guides/tutorial/invoice_form.jpg)
![Invoice PDF Preview](docs/guides/tutorial/invoice_pdf_preview.jpg)
![Quote PDF Preview](docs/guides/tutorial/quote_pdf_preview.jpg)

## ❓ Why Invoice Builder?

Invoice Builder is designed for freelancers, contractors, and small businesses who want:

- **Full ownership of their data** - no cloud lock‑in
- **Offline access** - works anywhere, anytime
- **A predictable, transparent tool** - no subscriptions, no hidden sync
- **Cross-platform support** - macOS, Windows & Linux
- **Import/export freedom** - JSON, XLSX, full database backups
- **Highly customizable PDFs** - branding, layout, colors, typography
- **UBL & Peppol BIS 3.0 support** – generate invoices that are compliant with European e-invoicing standards for automatic submission to buyers and public administrations

If you value **privacy, portability, and control**, this app is built for you.

## ✨ Key Features

### Core

- Create and manage **Invoices** and **Quotes**
- Offline-first: works without internet
- Database-file based (create or open a database anywhere)
- Automatic snapshotting of business, bank, style profile, layout, client, item, and currency data per invoice/quote
- Multi-currency support: choose the currency for each invoice/quote individually
- Responsive layout - usable on small and large screens, resizable windows supported
- Invoice/Quote translations – select a language per document, independent of app settings
- Export invoices in UBL 2.1 / Peppol BIS Billing 3.0 XML format, fully compliant for automated e-invoicing
- Export invoices in XRechnung (UBL 2.1) XML format, fully compliant for automated e-invoicing
- Native receipt printing for invoices and quotes in desktop Electron mode, including compact 80mm thermal receipt layouts for retail checkout workflows
- Receipt printing for invoices in web/Docker mode via the browser's own print dialog (e.g. "Save as PDF" as the destination)
- Log out from the sidebar to return to the database selection screen and switch databases without restarting the app

### Business Data Management

- Banks, Businesses, Clients, Items, Categories, Units, Currencies
- Quickly add a client while creating an invoice or quote, without leaving the document form
- Persistent search, persistent sort, persistent filter, archive (non-destructive)
- XLSX import/export for most entities
- Automatic creation of missing units/categories on item import

### Financial Flexibility

- Fixed or percentage surcharge
- Fixed or percentage discounts
- Shipping fees
- Tax:
  - inclusive or exclusive
  - per-item or on total
  - deducted tax
- Partial payments, balance due tracking
- Invoice states: unpaid, partially paid, paid, closed
- Quote states: open, closed

### PDF Generation & Customization

- Live PDF preview
- A4 / Letter formats
- Layout presets
- Color, font size, font family (Supported fonts: Helvetica, Times-Roman, Courier, Roboto, Inter), logo size customization
- Table header & row styles
- Uppercase label toggle
- Quote & invoice watermarks (including paid watermark)
- Attachments: include images in PDFs
- Signature support: upload or hand-draw signatures and apply them to PDFs
- Style profiles are now available for invoices and quotes, enabling quick, consistent theming
- Layouts and Visual Layout Builder for importing, creating, editing, and exporting V1/V2 invoice PDF compositions without manually writing JSON, with nested regions, sidebars, landscape layouts, rows, columns, grids, drag-and-drop, keyboard actions, undo/redo, live preview, and controlled content flow
- Layout JSON controls section order, visibility, header composition, supported block placement, spacing, table sizing, and page-level regions
- Export individual layouts as reusable JSON files
- See [Layout JSON reference](docs/guides/layout-json.md) for the complete layout JSON structure and usage guide
- Show quantity, unit, and row number in the PDF item table
- Custom header sections and custom values in the PDF item table
- Ability to reorder all columns/headers in the PDF item table
- Ability to include QR codes for payment into PDF
- Ability to customize invoice / quote labels to custom text

### Reports

- Aggregated data
- Charts and summaries

### Import, Export & Backup

- Full database backup & restore
- Export all data to JSON and import back
- Export to XLSX for most entities
- Invoices and quotes support export (historical documents remain immutable)

### Settings & Customization

- Language selection: currently French, German, English, Lithuanian and Portuguese
- Number & date formatting (e.g. `1,234.10` vs `1.234,10`)
- Invoice/quote number prefix & suffix
- Leading-zero invoice/quote numbering is preserved across auto-increment (for consistent alphabetical file sorting)
- File name customization for exported PDFs
- Light & dark mode
- Enable/disable UBL 2.1 Peppol BIS Billing 3.0, receipt printing, reports, style profiles, presets and quotes
- Check for updates via GitHub releases
- Presets: Predefine default Invoice/Quote data (e.g., business, client, currency, bank, style profile, notes, language, signature) to streamline document creation

## 🐘 PostgreSQL Support

Invoice Builder now supports **two database backends**:

| Storage Type            | Description                                                           | Best For                                           |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| **SQLite (local file)** | Simple, portable, zero‑configuration database stored as a single file | Solo users, offline use, desktop mode              |
| **PostgreSQL (server)** | Network‑accessible database server with concurrency and robustness    | Multi‑user setups, Docker deployments, NAS/servers |

Users can now choose between:

- **Creating or opening a local SQLite database file**, or
- **Connecting to a PostgreSQL server** by entering host, port, username, password, and database name.

This makes Invoice Builder flexible for both lightweight personal use and more advanced multi‑device or multi‑user environments.

### Multi-session web mode

Web/Docker mode supports multiple independent browser sessions without a shared server-wide current database:

- Each browser session receives an opaque server-issued session token.
- Each session/workspace is bound to its selected SQLite or PostgreSQL database.
- Requests resolve the database from the session context, so one browser cannot switch another browser's active database.
- Sessions expire automatically and stale database handles are cleaned up.
- Session tokens are held in `HttpOnly` cookies and are not accessible to browser scripts.
- Connection details are never persisted in the browser; reconnect after a backend restart.
- Deploy web mode behind HTTPS; the reverse proxy must forward `X-Forwarded-Proto: https` so the session cookie is marked `Secure`.

This is session isolation, not account authentication. The current application has no user login, roles, or workspace membership system. Electron desktop windows use separate database contexts locally.

## 🧠 Data Model & Snapshots

When an invoice or quote is created, snapshots of the following are stored with the document to ensure historical accuracy:

- **Bank**
- **Business**
- **Client**
- **Items**
- **Currency**
- **Style profile**
- **Layout**

Changes to these entities do **not** affect existing invoices or quotes.  
Snapshots are updated only when editing an invoice or quote and changing the associated **client, business, item, or currency**.

## 🔄 Backups & Data Portability

You can:

- **Back up and reopen** the full database file
- **Export all data to JSON** and import it back
- **Import and export layout JSON** files from the Layouts page
- **Export entities to XLSX** for manual editing
- **Import entities from XLSX**

> **Note:** Invoices and quotes are export-only to preserve historical data integrity.

## 📄 License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.

## ☕ Support

Invoice Builder is maintained by a single developer. Your support helps keep updates coming and new features rolling out!

Want to be a part of this project’s journey? You can support it here: [GitHub Sponsors](https://github.com/sponsors/piratuks) or [Buy Me a Coffee](https://www.buymeacoffee.com/evaldizi)
