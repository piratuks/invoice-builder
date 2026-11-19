# Completed Slice 2: Pro composition seams and proof fixture

## Status

**Complete for the public host seams and the user-approved local Pro composition
proof.**

Slice 2 adds Community-safe integration points for a future private Pro build and
demonstrates that private implementations can replace those defaults at build
time. It does not implement recurring invoices, SMTP, licensing, persisted Pro
settings, migrations, or background business workers.

## Delivered public host seams

- **Renderer:** `apps/renderer/src/edition/` defines a host-local contribution
  contract for child routes and navigation entries. The router merges contributed
  routes and reports collisions; the sidebar renders optional navigation entries.
  Community contributes neither.
- **Electron main:** `apps/desktop/main/edition/` provides a namespaced IPC
  registrar and one-time initialization seam. Community registers no handlers.
- **Electron preload:** `apps/desktop/preload/edition/` provides a dedicated,
  typed `electronAPI.edition` namespace. The Community API is empty and does not
  expose raw IPC.
- **Webserver:** `apps/server/edition/` provides a host-local route contribution
  and awaited start/stop hooks. Edition routes are mounted after the existing
  session/security and database-context middleware. Hook failures remain visible;
  shutdown continues cleanup if a hook fails.
- Host-specific framework types stay within their host. No universal plugin
  registry, dynamic package discovery, private dependency, or Pro build mode was
  added to the public repository.

## Local Pro composition proof

At the user's request, the private staging proof was created in a separate,
session-local workspace rather than a hosted private repository:

`/home/piratuks/.copilot/session-state/e5f09eb0-9037-40fb-9c19-540d5128df60/files/invoice-builder-pro-composition/`

The workspace includes `scripts/compose.mjs`, an exact-SHA staging orchestrator,
the four host implementation overlays, focused verification tests, and a README
with rerun instructions. It stages a clean detached public checkout, builds and
checks Community first, overlays only the documented implementation modules,
then verifies and builds the composed fixture.

The temporary pin is
`e1ffb89bf12d0449f3e7ea1ca2ecd8393c52b05b`. This is a local-only commit in an
isolated snapshot clone of the current public seam changes. The public checkout
was not committed to or pushed. The temporary SHA is not fetchable by another
machine; a durable private Pro repository must replace it with the exact
published public commit SHA containing the seams.

The fixture proves:

- Renderer `/edition-proof` route and matching navigation entry.
- Typed `electronAPI.edition.getProofStatus()` over
  `edition:proof-status`.
- Webserver `/api/edition/proof` route and awaited startup/shutdown lifecycle
  callbacks.
- Community bundles contain none of the private proof markers; composed
  production bundles contain the expected markers.

## Verification evidence

- Community production builds passed: `npm run build:renderer`,
  `npm run build:desktop`, and `npm run build:webserver`.
- Community host regression suite: **6 test files, 17 tests passed**.
- Composed proof suite: **4 test files, 4 tests passed**.
- Pro production builds passed for renderer, Electron main/preload, and webserver;
  all expected proof markers were found in their respective bundles.
- Renderer Vite served the composed fixture module. Electron main/preload
  development-mode builds passed. The live webserver dev endpoint returned the
  Pro proof payload, rejected an invalid session, and recorded start/stop hooks.
- Script syntax, private-workspace formatting, and public `git diff --check`
  passed.

## Boundaries and follow-up

- No commit or push was created in the public checkout.
- The hosted private repository was not involved. The local composition workspace
  is sufficient for the user-approved Slice 2 proof but must be transferred to
  that repository before it can serve as its durable build pipeline.
- The development proof compiles Electron main and preload in development mode;
  it does not launch a packaged Electron app. Release packaging/signing and
  database lifecycle hooks are outside Slice 2.
- Later recurrence work should consume these seams rather than introduce another
  composition mechanism. Database lifecycle integration remains deferred until
  the worker/database ownership design is defined.
