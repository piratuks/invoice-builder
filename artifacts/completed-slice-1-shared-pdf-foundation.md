# Completed Slice 1: Shared PDF foundation

## Status

**Complete — public `@invoice-builder/pdf` package extracted and adopted by the renderer.**

This is the completed extraction slice from
[story-23-recurring-invoices.md](./story-23-recurring-invoices.md). It establishes
a shared PDF implementation that future Electron/server Pro features can consume.
It does not implement recurring schedules, email delivery, backend invoice/data
preparation, PDF persistence, or Pro licensing.

## Delivered

- Added the standalone `packages/pdf` workspace package, `@invoice-builder/pdf`.
- Moved the invoice PDF document, presentation components, layout/styles, font files,
  runtime font registration, and the oversized-row pagination workaround into the
  package.
- Added typed, self-contained `InvoicePdfInput` and shared PDF types. The package
  consumes prepared invoice/settings/text/asset data and does not fetch records,
  access app state, or translate labels.
- Added separate browser and Node package entry points. Both expose the shared
  `InvoicePdfDocument` and `renderInvoicePdf(input): Promise<Uint8Array>` API.
- Moved shared invoice calculations, formatting helpers, and related enums into the
  package and updated renderer callers to import them directly.
- Migrated renderer preview and export to the shared package. The renderer still
  prepares data and assets and owns preview/download UX.
- Added PDF-package tests for both layout schema versions, fonts, assets, pagination,
  document/component branches, formatting, and invoice calculations.
- Added root build/dev/test integration and documented the package in the development
  project-structure guide.

## Verification evidence

- PDF package TypeScript check passed, including package tests.
- Renderer TypeScript check passed after migration.
- Renderer production build passed after replacing the renderer re-export shims.
- Focused PDF package, renderer preview/export, and Node PDF layout tests passed,
  including generated-PDF parsing/content/page-count checks and the oversized-row
  pagination behavior.
- `git diff --check` passed during the migration.

The browser PDF smoke test runs in the repository's jsdom test environment and
explicitly registers a packaged font. It confirms the browser entry can render PDF
bytes, but it is not a real Chromium/Electron packaged-runtime font-registration
test. No packaged Electron or Docker runtime verification was part of this slice.

## Consumption boundary

The renderer currently uses the package for preview and export. The Node entry point
is available for backend callers, but backend/Pro code must still prepare invoice
data and inline asset URLs, call the Node renderer, and persist or attach the
returned bytes. Those are integration responsibilities for future consumer slices;
they are not required to consider the shared package extraction complete.
