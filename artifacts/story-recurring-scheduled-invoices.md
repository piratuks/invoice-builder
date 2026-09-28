# Scheduled and recurring invoice delivery

## User value

Small businesses and freelancers can automate repeat billing by creating invoices on a schedule and optionally delivering them to clients without manually reopening old invoices each period. The feature must work for desktop users on Windows, macOS, and Linux, and for self-hosted web/docker users.

## Scope

- In scope:
  - Create, edit, pause, resume, and delete recurring invoice schedules.
  - Generate invoices from an existing invoice/template on a configured cadence.
  - Support at least weekly, monthly, quarterly, and yearly schedules with next-run calculation.
  - Persist run history, last run, next run, status, and failure reason for auditability.
  - Process due schedules in Electron desktop mode while the app/database is open.
  - Process due schedules in self-hosted web/docker mode from the always-on backend webserver process using an internal cron-like scheduler.
  - Catch up missed runs deterministically after app/server downtime, with duplicate prevention.
  - Optional delivery action after invoice creation: none or email depending on configured capability.
  - Show scheduled/recurring invoice controls in the renderer and expose matching Electron IPC plus web REST APIs.
- Out of scope for first implementation slice:
  - Payment collection, payment reminders, debt collection, or client portal flows.
  - Guaranteed native desktop execution while the app is fully closed.
  - OS startup/background helpers such as Windows Service, macOS launch agent/login item, Linux systemd service/timer, or tray-only background mode.
  - WhatsApp delivery or WhatsApp Business API integration.
  - Multi-tenant hosted SaaS operations beyond existing self-hosted database/session model.

## Acceptance criteria

1. A user can create a recurring invoice schedule from an existing invoice or invoice draft by choosing cadence, start date, optional end date or occurrence count, and delivery method.
2. A schedule has clear statuses: active, paused, completed, failed, and archived/deleted.
3. When a schedule is due, the app creates exactly one invoice per due occurrence using the source invoice data, current invoice numbering rules, and current due-date offset rules.
4. If the native app is closed during one or more due times, the next app launch catches up according to the schedule policy without creating duplicate invoices.
5. Desktop builds for Windows, macOS, and Linux process schedules through the Electron main process while the app and selected database are open.
6. Self-hosted web/docker mode processes schedules from the backend webserver process while that process/container is running, using a cron-like internal worker without requiring a browser tab or host-level cron job.
7. If the self-hosted backend is stopped during one or more due times, the next backend startup catches up according to the schedule policy without creating duplicate invoices.
8. Email delivery is disabled until SMTP or provider settings are configured; once configured, successful and failed send attempts are recorded per generated invoice.
9. Users can view schedule history, last run, next run, generated invoice id, delivery status, and last error from the UI.
10. Existing invoice creation, duplication, e-invoice export, PDF/export behavior, and invoice sequence uniqueness continue to work.

## Risks and constraints

- Requires database migrations for schedules, schedule runs, delivery settings, and delivery attempts.
- Requires shared scheduling logic so Electron and webserver modes do not drift.
- Requires idempotency keys or uniqueness constraints to prevent duplicate invoices during retry/catch-up.
- Native desktop v1 intentionally does not guarantee execution while the app is closed; user-facing copy must explain catch-up-on-launch behavior.
- Any later native background execution across Windows, macOS, and Linux will affect packaging, auto-start permissions, and user trust.
- Self-hosted scheduling should be cron-like from the user's perspective, but owned by the webserver process so Docker users do not need to configure host cron separately.
- Direct email needs SMTP/provider credential storage.
- Self-hosted instances may use multiple databases/workspaces; scheduler ownership and active database discovery need careful design because the backend process is the worker.
- Time zones, daylight saving changes, month-end dates, and invoice numbering races are product-critical edge cases.

## Affected layers/files

- Database and migrations: `src/backend/shared/db/setup.ts`, `src/backend/shared/migrations/*`, migration tests.
- Shared services/types: `src/backend/shared/services/*`, `src/backend/shared/types/*`, invoice service helpers.
- Electron main process: `src/backend/main/ipc/*`, `src/backend/main/main.ts`, database lifecycle code.
- Preload bridge: `src/preload/preload.ts`.
- Webserver: `src/backend/webserver/main.ts`, `src/backend/webserver/controllers/*`, scheduler lifecycle code similar to cleanup scheduler.
- Renderer/API: `src/renderer/shared/api/*`, `src/renderer/pages/invoices/*`, settings pages for delivery credentials, i18n files.
- Packaging/docs: `electron-builder.yml`, `README.md`, `TUTORIAL.md`, `History.md` if background-at-login or provider setup is included.

## Verification plan

- Unit test recurrence date calculation, catch-up behavior, duplicate prevention, pause/resume/completion, and month-end/time-zone edge cases.
- Service tests for creating invoices from schedules using existing numbering and snapshot behavior.
- Migration tests for fresh schema and upgraded databases.
- Electron IPC/preload tests for schedule CRUD and manual run actions.
- Webserver controller tests for schedule APIs and scheduler processing without a browser session.
- Renderer tests for creating, editing, pausing, resuming, deleting, and viewing schedule history.
- Build checks: `npm test`, `npm run build:electron`, `npm run build:webserver`, and renderer build/tests for touched UI.

## Recommended delivery slices

1. Data model and shared recurrence engine with no delivery.
2. Schedule CRUD APIs for Electron and webserver, plus basic UI.
3. Scheduler execution in Electron while the app is open and in the self-hosted webserver while the backend is running, with idempotent invoice generation.
4. Delivery settings and email sending.
5. Optional native background-at-login packaging/documentation.

## Coordination recommendation

Delivery and Scrum coordination is recommended. This is a cross-layer feature with persistence, runtime scheduling, provider configuration, platform behavior, and release risk.
