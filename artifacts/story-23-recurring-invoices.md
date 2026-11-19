# Story: Recurring invoices and direct delivery

## Title

Create recurring invoices and deliver their PDFs from Invoice Builder.

- Related issue: [#23 - Scheduling/recurring invoices](https://github.com/piratuks/invoice-builder/issues/23)
- State: `draft`
- Drafted: 2026-10-03
- Readiness refinement: 2026-11-13 - added decision options, recommendations, and slice gates.
- Scope updated: 2026-10-03 - SMTP-only delivery, shared PDF package, independent feature toggles.
- Catch-up policy approved: 2026-10-03 - generate missed active periods; review emails by default.
- Provider ownership approved: multiple named configurations per database; each
  email-enabled schedule selects one. SMTP remains the only first-release type.
- Pending-delivery policy approved: freeze message/addressing/provider selection
  per delivery; resolve current SMTP connection settings and credentials at send time.
- Restore/import policy approved: restored databases require review before recurring
  automation or restored pending deliveries can resume.
- Email content policy approved: translated plain-text defaults, per-schedule
  customization, validated placeholders, and a resolved preview.
- First occurrence policy approved: user confirms first new invoice date; warn,
  but do not block, when another active schedule uses the same source invoice.
- Billing-period policy approved: each schedule selects upcoming or previous period,
  with cadence-anchored boundaries independent of issue and payment-due dates.
- Schedule edit policy approved: changes have an explicit effective occurrence;
  older missed periods retain their previous configuration.
- Schedule lifecycle approved: Pause is reversible; Stop is terminal. Restart
  billing by creating a new schedule with a newly confirmed first occurrence.
- Frequencies approved: weekly, monthly, and yearly for the first release;
  custom intervals and arbitrary cron expressions are deferred.
- Calendar rules approved: anchored month/leap-day fallbacks, deterministic DST
  handling, inclusive end date, and confirmed past-first-date catch-up preview.
- Feature defaults approved: recurrence and delivery are off until explicitly
  enabled; updates/restarts preserve saved choices and activation starts no work.
- Background-worker scope approved: Electron processes only its active/open database;
  Docker processes one explicitly configured database.
- SMTP credential storage approved: Electron uses `safeStorage`/OS-backed encryption;
  Docker uses mounted secret files; the database stores references, not plaintext.
- Operational settings profile approved: adopt the proposed v1 defaults and safe
  bounds in D3; validate behavior through implementation tests.
- Schedule-edit boundary approved: the selected effective occurrence is the first
  under the new configuration; earlier occurrences retain the prior configuration.
- Delivery recovery policy approved: provider configuration failures require a
  corrected, tested provider and explicit resume; uncertain SMTP outcomes require
  review and cannot use ordinary retry.
- Retry-attempt bound approved: maximum five total attempts (initial attempt plus
  four retries), matching the 1/5/15/60-minute retry delays.
- Recurring-invoice and delivery implementation: not started.
- Slice 1 (shared PDF foundation): complete; see
  [completed-slice-1-shared-pdf-foundation.md](./completed-slice-1-shared-pdf-foundation.md).
- Pro commercial direction: perpetual license with 12 months of new Pro features
  and updates; pricing is a test hypothesis, not a validated market benchmark.
- Keep licensing implementation separate from the scheduling/PDF foundation.
- Distribution direction: retain a fully MIT Community build and publish a separately
  labelled Pro-ready build composed with private packages.

## User value

Businesses with repeat customers can configure billing once, track upcoming
invoices, and generate and send them without manually duplicating invoices and
exporting PDFs each period. The same configuration works in Electron and
self-hosted Docker, with clearly different availability guarantees.

## Decision status

- This story remains `draft` because the recurring-invoice and delivery feature
  implementation has not started. Slice 1, the public shared PDF foundation, is
  complete and documented separately. The remaining feature behavior and slice-level
  decisions are sufficiently defined to begin; unresolved Pro commercial terms gate
  only a paid launch.
- Approved product behavior is the baseline. The decisions below refine
  implementation boundaries and numerical defaults; they do not reopen approved
  lifecycle, calendar, billing-period, or catch-up policies.
- This is an umbrella feature brief, not one release-sized implementation task.
  PDF extraction, delivery, recurrence, runtime workers, and Pro distribution/
  licensing are separately deliverable tracks. Pro distribution and licensing
  must not block a Community PDF/scheduling foundation.
- A decision is a gate only for the slice named in the decision table. Work that
  does not depend on that decision may proceed.
- Commercial prices and final license terms remain release questions, not gates
  for implementing or testing recurring invoices and SMTP delivery.
- State tables describe feature behavior, not new invoice/payment states.

## Pro offer and licensing direction

### Proposed launch offer

- Test a EUR 49 early-adopter one-time purchase, with a stated EUR 69 regular price.
- Include the Pro features available at purchase, plus 12 months of new Pro features
  and updates. Recurring Invoices and Delivery Providers with SMTP form the intended
  initial bundle; confirm the exact paid/free boundary before launch.
- Customers retain perpetual use of purchased functionality and additional Pro
  features received during their entitlement period.
- Offer optional renewal for another 12 months of new Pro features and updates,
  initially proposed at EUR 29. This is not required to keep using owned features.
- Prices are launch experiments rather than validated market rates. Confirm tax
  treatment, currency presentation, checkout fees, and final terms before publishing.

### Customer guarantees

- Expiry of the feature-update period is not expiry of the software license.
  Non-renewal must not disable purchased email delivery, stop recurring schedules,
  delete configurations/history, or force customers onto an older application.
- Current app releases must recognize existing entitlements: owned Pro functionality
  remains usable, while new paid features released after the entitlement period can
  require renewal. Free/core updates and security fixes remain available.
- Do not advertise unlimited access to all future products, integrations, or features
  forever. Explicitly describe the 12-month inclusion window and bundle boundaries.
- Proposed license scope is one business, covering its owner's desktop installation
  and self-hosted deployment, with no per-invoice fee. SMTP service charges remain
  the customer's responsibility. Exact device/deployment limits require final terms.
- Feature enable/disable Settings remain operational controls, separate from license
  entitlements. An expired update window must not act as a global feature-off switch.

### Implementation and release decisions

- Treat checkout, license issuance, offline verification, recovery/transfer, refunds,
  and entitlement enforcement as a separately scoped release task. Electron and
  self-hosted Docker must not depend on an always-online licensing check to keep
  owned recurring billing operational.
- Define stable feature entitlements and feature-release eligibility dates so newer
  app versions preserve purchased capabilities without granting every later paid
  addition. Define renewal-window timing before implementing eligibility checks.
- The existing MIT license continues to apply to code distributed under MIT.
  A commercial Pro offer does not revoke existing reuse rights. Decide where paid
  components are distributed and under which terms; do not rely on a toggle inside
  MIT code as an exclusive legal restriction. Review distribution/licensing terms
  before launch.
- This story captures commercial direction, not an implemented checkout or a binding
  public price promise. Licensing must not complicate the shared PDF/scheduler core.

## Community and Pro build architecture

### Two clearly identified distributions

- Produce two distinct outputs:

  | Output | Build source/process | What runs before license activation |
  | ------ | -------------------- | ----------------------------------- |
  | Community | Built from the public repository alone; requires no private repository access, credentials, or packages. | Existing public/MIT features only. |
  | Pro-ready | Built by a private composition pipeline from a pinned public commit plus private Pro packages. | Existing free features work; Pro code is already included but gated until a valid license unlocks the entitled features. |

- The normal public-repository build remains the Community build. It does not
  fetch or require private packages. Building Pro is a separate, explicit private
  pipeline operation; it produces a Pro installer/image rather than changing the
  public build in place.
- A customer of the Pro-ready distribution installs that build first, then enters
  or imports a license key/file in the app. A valid license unlocks the Pro
  capabilities already present in that build; activation does not download code.
  Without a license, free functionality remains usable.
- Community remains a separate distribution and cannot unlock private Pro code
  merely by entering a key. Its Pro action can explain the Pro-ready download and
  switching process; automatic Community-to-Pro application replacement is not
  part of this design.
- Preserve existing free functionality and a first-class Community download option.
  Disclose proprietary components and their terms on Pro downloads and in the app.
- Publish finished Community and Pro-ready installers on the public project's
  releases if desired, with distinct artifact names. Publish clearly separate Docker
  image names/tags. Public artifact availability does not make Pro code MIT.
- Private source remains private, but distributed Electron/Docker code can be
  inspected or extracted. Do not promise unbreakable copy protection.

### Private composition, not a public private-package dependency

- Keep Pro source and release composition in a private repository. It consumes a
  pinned public commit; the public app must not depend on private packages.
- Start with one private Pro repository containing the feature packages and
  composition/build configuration; split packages into separate private
  repositories only if ownership or release management later requires it.
- Initially use local npm workspaces, not a required private registry. Assemble a
  temporary workspace containing public sources and private packages under
  `packages/*`, with a controlled composition manifest and private lockfile.
- In the private build job, check out the pinned public commit, add the private
  packages into that temporary workspace, and overlay only the explicitly
  documented host integration implementation entry points. Install from the
  private composition manifest/lockfile and build/test the Pro targets. This
  declared overlay is the build-time composition seam, not an ad hoc text patch
  to public business logic. Do not write private package references back into
  public manifests or its lockfile.
- Keep public manifests/lockfile independently installable. Do not commit private
  dependency references, private source, access tokens, or license-signing keys to
  the public repository. The combined lockfile belongs to private composition.
- Pin the public source and private package versions for reproducible releases.
  Avoid maintaining a divergent app fork or changing public business logic through
  unreviewed release-time text replacements.
- Proposed ownership:
  - Public: existing app/core/contracts, shared PDF package, and small typed optional
    integration interfaces.
  - Private: recurring/delivery implementation and UI, Pro API definitions,
    entitlement enforcement, and Pro build/release configuration.
- Public extension contracts must not import private types. Put Pro-specific DTOs
  in a private contracts package; keep shared infrastructure interfaces public.
- Existing public core services remain public. Extract only necessary reusable
  helpers; do not move existing MIT functionality behind the Pro boundary.

### Minimal typed registration points

- Community supplies empty optional integrations; Pro composition supplies its
  feature implementations at build time. Do not download executable packages during
  license activation or introduce a general-purpose plugin marketplace.
- Renderer integration registers additional routes, sidebar entries, Settings
  sections, and relevant invoice actions.
- Electron integration registers explicit IPC handlers and database-open/close,
  startup/resume, and shutdown worker hooks. Extend preload with a narrowly scoped,
  typed Pro API in Pro builds; never expose arbitrary command execution.
- Server integration registers Pro REST routes and authorized background lifecycle
  hooks. Coordinate worker database ownership with existing session cleanup.
- Renderer/Electron Vite targets can select integration implementations at build
  time. The server is compiled by TypeScript, so Vite aliases alone are insufficient:
  use real compiled workspace packages or generated runtime-resolvable entry modules.
- Declare dependencies in their owning workspace. Check that externally loaded
  Electron modules are packaged; bundling does not eliminate native/runtime assets.

### Upgrade and activation

- Pro-ready "Upgrade to Pro" opens hosted checkout in an external browser.
  A separate licensing service issues a signed license only after verified payment
  confirmation, not merely a browser success redirect.
- First-release activation can paste/import the signed license. Automated browser
  return/deep-link activation is optional later.
- Apps verify licenses locally using a public verification key. Private signing keys
  remain service-owned and are never included in source bundles or installers.
- License data identifies the license/business, owned feature entitlements,
  purchase date, feature-update eligibility end date, and license format version.
  Update eligibility is not an activation-expiry date.
- Enforce entitlements in Electron handlers and server endpoints/workers as well as
  UI. Buying/activating Pro unlocks configuration; it must not silently enable
  schedules, release recovery holds, or submit emails.
- Store activation at installation level: desktop application configuration and a
  persistent Docker configuration volume, separate from invoice databases.
  One-business use can cover its databases; restoring a database cannot overwrite
  activation. Exact installation/transfer rules still require commercial terms.
- Offline verification must preserve owned capabilities without a mandatory
  always-online check. Define refunds/revocation and license-sharing policies
  honestly; immediate offline revocation is not guaranteed.

### Packaging, updates, and database compatibility

- Keep Community packaging independent; private composition supplies a Pro Electron
  Builder configuration and Dockerfile. The existing Dockerfile explicitly copies
  known workspaces, so Pro manifests, compiled packages, assets, and runtime
  dependencies must be included deliberately.
- Use separate artifact names and edition-specific updater feeds/metadata so updates
  cannot replace Pro with Community or collide in a shared public release.
- Decide installer identity, application data paths, signing, and switching behavior
  before release. Do not assume a filename change alone creates separate products.
- Support opening existing data when switching editions, with a backup first.
  Do not run both editions against the same SQLite file simultaneously.
- Public core migrations remain independently usable. Track proprietary schema
  migrations separately; the existing migration builder only discovers core
  migrations and needs an explicit Pro build/migration integration.
- Community must tolerate and preserve Pro schema/data without running Pro jobs.
  Test Community -> Pro -> Community on supported schema versions; this does not
  promise arbitrary older-version downgrades.
- Review core import/export, restore, settings updates, and deletion behavior so
  Community does not silently erase Pro tables, feature settings, or delivery history.
  Flag flows that cannot preserve extension data rather than claiming lossless support.
- Packaging, CI/release configuration, migration strategy, and distribution terms
  require maintainer review before implementation.

## Scope

### Confirmed direction

- Invoices only. Quotations cannot be recurrence sources or generated documents.
- Create a recurring schedule from an existing, saved invoice.
- UI for creating, starting, pausing, editing, and stopping a schedule.
- Generate a new invoice for every due occurrence, with its own invoice number,
  dates, unpaid status, and document snapshots. Never resend the original invoice
  as if it were the next billing period.
- Generate the PDF without depending on an open React page.
- Generation-only recurrence saves invoices without automatically rendering or
  storing PDFs. Render on export or delivery preparation; persist delivery PDFs
  before submission, without requiring ordinary exports to become stored artifacts.
- Extract React-PDF document generation into a separate shared package consumed by
  the frontend for its existing preview/export and by backend runtimes for email attachments.
- Introduce an extensible Delivery Providers feature; SMTP email is the only
  implemented and selectable delivery method in the first release.
- Support multiple named delivery-provider configurations per database, all of
  type SMTP initially. Each email-enabled recurring schedule explicitly selects
  which configured provider to use.
- Give Delivery Providers and Recurring Invoices their own configuration/management
  UI sections and independent feature toggles in Settings, following existing features.
- With Delivery Providers disabled, active recurrence continues creating invoices
  without sending. With Recurring Invoices disabled, all recurring generation and
  associated automatic delivery stop.
- Electron checks for due/missed occurrences on startup and while running.
- Docker runs a backend scheduler without requiring an open browser.
- No native OS service, startup daemon, or OS scheduled task in the first version.

### Corrections and boundaries

- SMTP is the agreed first-release provider, not an existing integration:
  inspection found no SMTP or Nodemailer sending implementation in the app.
- Electron must wait until the relevant database is open and usable before
  processing schedules. "On startup" does not mean before database selection.
- Electron cannot send while fully exited, the computer is off, or the system is
  asleep. Check again after resume and database activation; reconcile on restart.
- Docker can run unattended only while its backend is running. Persisted state
  and catch-up are still necessary after container downtime.
- A backend timer is sufficient to wake the initial single-instance worker; a
  separate scheduler service is not required. The timer is not the source of truth.
- Recurring invoicing is not automatic payment collection or a subscription
  billing engine. Creating or sending an invoice must not mark it paid.
- Generated invoices follow the existing invoice lifecycle: they start unpaid
  and remain unpaid until the user records payment through the existing workflow.
  Delivery status is separate from invoice/payment status; do not introduce a new
  invoice approval or immutable-revision workflow for this feature.
- Email submission to SMTP is not proof of delivery to the recipient's inbox.

### Feature settings and global controls

- Persist independent Delivery Providers and Recurring Invoices feature flags in
  the active database's Settings. Enforce them in backend workers, REST, and IPC,
  not just through navigation visibility.
- Add toggles using the existing Settings feature-toggle pattern. Both flags
  default to off for new databases and existing databases without a saved choice,
  until explicitly enabled. Persist and preserve existing choices through ordinary
  updates/restarts; a migration must not reset an explicitly enabled flag.
- Pro activation unlocks configuration but does not enable either feature, activate
  schedules, or submit emails. Restored saved choices remain subject to the separate
  persistent recovery hold.
- Delivery Providers has its own UI section to create, edit, and manage named SMTP
  configurations, validate each connection, and send a confirmed test email through
  the selected configuration. Recurring Invoices has its own section
  to manage schedules and inspect generation/delivery history.
- Disabling Delivery Providers blocks all new sends, test emails, and retries,
  including queued work. Active recurring schedules continue generating invoices.
  Occurrences generated while delivery is off are recorded as generation-only,
  not accumulated as emails to send automatically when the feature is re-enabled.
- Retain SMTP configuration, schedule delivery preferences, existing PDFs, and
  history when delivery is disabled. Previously queued deliveries are suspended;
  re-enabling requires review before resuming those sends.
- Disabling Recurring Invoices is a global operational stop: do not create any new
  occurrences/invoices or submit automatic recurring deliveries, including retries.
  Retain schedules and their individual lifecycle states rather than irreversibly
  marking every schedule stopped. Show that the global feature is disabled.
- Re-enabling Recurring Invoices must not activate individually paused/stopped
  schedules or silently send a backlog. Skip periods during the
  explicit global disable interval and review work already pending before disable.
- Manual invoice email remains available when recurrence is off and delivery is on.
- Check flags immediately before invoice creation and provider submission. An
  operation already committed or an email already submitted cannot be undone.
  Explain this boundary when disabling a feature.

| Recurring Invoices | Delivery Providers | Behavior                                                                                                                     |
| ------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| On                 | On                 | Active schedules generate invoices; email-enabled schedules send via configured SMTP. Generation-only schedules do not send. |
| On                 | Off                | Active schedules generate invoices only. No automatic or manual sends or delivery retries.                                   |
| Off                | On                 | No recurring generation or automatic recurring sends. Manual invoice email is available.                                     |
| Off                | Off                | No recurring generation and no sends. Existing manual invoice creation/export remains available.                             |

### Approved pause and stop policy

- Pause temporarily suspends a schedule's generation and automatic sending.
  Skip occurrences during the pause; preserve existing pending work for review.
  Resume previews the next run and requires review before releasing suspended sends.
- Stop ends the billing arrangement permanently. Stopped schedules cannot resume
  or restart, and no further catch-up generation or automatic sending may execute
  for them. Preserve existing invoices, occurrence records, and delivery history.
- Stop leaves safely unsent pending deliveries suspended and inspectable, not
  automatically submitted. Users may explicitly cancel them or prepare a manual
  email for an existing invoice, subject to Delivery Providers and other holds.
  Never release them by re-enabling recurrence or activating a license.
- Offer "Create new schedule from this one" for stopped schedules. Copy template
  and configuration only, not occurrence identities, pending jobs, or execution
  history. Require confirmation of a new first occurrence and ordinary activation
  review; do not inherit or replay the cancelled interval as missed billing.
- Global recurrence disable remains an operational gate, not an individual Stop.
  Pause/stop cannot recall an email already submitted. Existing invoice payment
  status remains unchanged.

### Approved schedule edit policy

- The edit flow requires "Apply changes starting from [occurrence date]" and
  previews the resulting invoice/delivery settings and future dates before saving.
  Default to the next eligible future occurrence; older missed periods are not
  silently repriced or rescheduled.
- Persist effective-dated schedule configurations. A missed, unmaterialized
  occurrence uses the configuration that applied at its scheduled time, even when
  reconciliation runs after later edits. Preserve the previous configuration until
  historical occurrences and their audit records no longer require it.
- This applies to invoice template items/prices, taxes/discounts, cadence, timezone,
  billing-period approach, recipient, selected provider, email content, delivery
  preference, and automatic catch-up email preference.
- Example: November was scheduled at EUR 100 but not generated; an edit effective
  December changes the price to EUR 150. Catch-up creates November at EUR 100 and
  December at EUR 150, both using actual creation dates and original billing periods.
- Generated invoices, saved PDFs, and prepared delivery snapshots do not change.
  Current SMTP connection settings/credentials remain resolved at submission time
  as already agreed; provider configuration corrections are not historical schedule
  edits.
- Cadence/timezone edits must preview the old schedule's final occurrence and the
  new configuration's first occurrence, with an unambiguous effective boundary.
  Do not drop an older missed occurrence, create overlapping occurrences, or reset
  an already processed occurrence's idempotency identity.
- Effective dates cannot rewrite processed occurrences. Validate conflicting edits
  and require confirmation of the transition preview; fine-grained calendar boundary
  rules follow the approved boundary in D4 under "Open decisions and implementation details".
- This is schedule-configuration history, not a new invoice revision/payment model.
  Global feature flags, pause/stop intervals, and recovery holds still gate execution.

### Approved calendar boundary policy

- Compute all occurrences in the schedule's explicit timezone, independent of the
  computer/container timezone. Preserve the original calendar anchor rather than
  advancing from an adjusted fallback date.
- Monthly anchors on the 29th-31st use the last valid day in shorter months and
  return to the original day when possible. A yearly February 29 anchor uses
  February 28 in non-leap years and February 29 in leap years.
- If daylight saving makes the scheduled local time nonexistent, execute at the
  first valid local time after the gap. That resolved instant is the scheduled due
  time for grace-window evaluation, not an automatic catch-up exception.
- If the local time occurs twice during a backward clock change, use its first
  occurrence and generate only once. Occurrence identity must remain stable across
  timezone offsets and restart so the second clock occurrence cannot duplicate it.
- The end date is inclusive in the schedule timezone: include occurrences scheduled
  on that local date, and none scheduled afterward. Reconcile eligible missed
  occurrences later even if actual processing is beyond the end date; explicit Stop
  and other holds still prevent execution.
- If the confirmed first occurrence is in the past, preview every eligible missed
  occurrence and the resulting generation count before activation. Large previews
  may be paginated, but must disclose the complete count and period range. Require
  explicit confirmation; the usual catch-up sending approval remains separate.
- Preview, billing-period boundaries, and workers share these calendar rules.
  These are fixed behavior, not additional user-configurable fallback options.

### Approved billing-period policy

- Each schedule explicitly selects "Bill upcoming period" (in advance) or
  "Bill previous period" (in arrears). Do not infer this from the source invoice.
- Calculate period boundaries from the schedule's recurrence anchor in its timezone,
  not from actual processing time. For an occurrence on November 1 in a monthly
  schedule, upcoming means November 1-30 and previous means October 1-31.
- Periods follow the cadence rather than always using calendar months: a monthly
  schedule anchored on the 15th bills the 15th through the day before the next
  occurrence. Apply the same anchored month-end rules as recurrence generation.
- Represent periods as local date ranges: upcoming starts on the occurrence's local
  date and ends the day before its next theoretical occurrence; previous starts on
  the preceding theoretical occurrence's local date and ends the day before the
  current occurrence. Theoretical boundaries exist even before the first generated
  invoice or after the schedule end date; boundary calculation does not create
  extra invoices.
- Show the selected approach and resolved start/end dates in setup and next-run
  previews. Store those dates with each generated occurrence.
- Keep billing period distinct from issued date and payment due date. Catch-up
  preserves the originally scheduled period while issuing on actual creation date.
- Resolve `{{billingPeriod}}` from the stored range using invoice language and
  captured date formatting. This is descriptive metadata, not usage calculation,
  proration, payment collection, or a change to invoice/payment status.

### Approved catch-up policy

- Use the same policy in Electron and Docker. Runtime downtime is not an
  intentional schedule pause or feature disable.
- Automatically create one normal unpaid invoice for every missed occurrence
  that fell while its schedule and Recurring Invoices were enabled. Do not merge
  periods, generate only the latest, or silently discard older eligible periods.
  Process large backlogs in bounded batches without losing remaining work.
- Skip occurrences that fell during an explicit schedule pause or global recurrence
  disable. Retain pre-existing pending work for review on resume/re-enable.
- Occurrences falling while Delivery Providers was disabled are generation-only,
  including when reconciled after downtime. They do not become automatic email
  backlog when delivery is enabled again. Persist enable/disable history so this
  determination uses the occurrence time, not only current feature settings.
- Catch-up invoices use the actual creation date as their issued date, retain the
  original scheduled occurrence and billing period separately, and calculate
  their due date from the issued date and configured payment terms.
- For email-enabled schedules, missed occurrences outside a scheduling grace
  window require explicit approval in a "Review missed invoices" flow before
  email submission. Invoice generation itself does not require that approval.
- Provide a persisted, per-schedule "Automatically email missed invoices" option,
  off by default. Explicitly enabled unattended catch-up can send without review,
  but cannot override feature flags, schedule pause/stop, or delivery failures.
- Normal occurrences, including minor processing delays within the grace window,
  send automatically when schedule email is enabled and SMTP is configured.
  The recommended initial grace window is 15 minutes; see D3 for the proposed
  approved profile and bounds.
- Track catch-up review separately from invoice payment status. Approval authorizes
  sending only; it does not mark an invoice paid. Persist pending approvals and
  ensure restart/reconciliation does not generate another invoice for the same period.

### Approved restore/import recovery policy

- An explicit in-app database restore/import must place the restored database on
  a persistent automation hold before any worker can process it. This applies even
  when the backup has recurrence/delivery feature flags enabled.
- While held, do not generate recurring invoices, send automatic recurring emails,
  or retry restored pending deliveries. Restored pending manual deliveries also
  require review before submission. Do not use restored queue state as permission
  to send.
- Explain that invoices and emails processed after the backup was taken may be
  missing from the restored history and could otherwise be duplicated.
- Show schedules, upcoming/missed periods, and pending deliveries for review.
  Users explicitly reconcile already-processed periods and cancel/resolve obsolete
  queued deliveries before approving resumed automation. Review may identify
  genuinely missed periods; apply the approved catch-up policy only after release
  of the hold. Retain an audit record of reviewed/skipped periods and approval.
- The hold must survive restart and must not be cleared by merely toggling features
  off/on. Individual schedule and feature states still apply after approval.
- Ordinary app/container restarts are not restores and continue normal recovery;
  they must not introduce a new mandatory review.
- Out-of-app database-file replacement may not be reliably detectable. Document
  that users must stop workers before restoring files and invoke recovery review
  before resuming. Provide a way to manually place a database on recovery hold
  for this workflow; do not promise automatic detection.

### Approved email content policy

- SMTP provider configuration controls connection and sender identity; the recurring
  schedule controls the email subject and body. Provide translated defaults based
  on the invoice language, with per-schedule subject/body customization.
- First-release messages are plain text. Rich-text/HTML editing is out of scope.
- Support exactly these placeholders initially:
  - `{{clientName}}`
  - `{{businessName}}`
  - `{{invoiceNumber}}` - full displayed number, including prefix and suffix.
  - `{{issuedDate}}`
  - `{{dueDate}}`
  - `{{billingPeriod}}`
- Resolve values from the generated invoice and its occurrence metadata, not
  current client/business records. Format dates using captured invoice formatting
  settings. Manual sends use invoice values; an invoice without recurring metadata
  has no billing-period value.
- Show a resolved subject/body preview before activating schedule email delivery.
  Mark example values when the next invoice number/date is not yet allocated;
  previewing must not consume an invoice number or generate an invoice.
- Reject unsupported/malformed placeholders at save and delivery preparation.
  Do not send literal unresolved placeholder tokens to customers.
- Preview and warn about absent optional values such as due date or billing period.
  Block delivery preparation if the selected template requires an absent value;
  users can remove the placeholder or supply the missing invoice/schedule data.
  A due-date sentence is included in the default only when a due date is available.
- Manual invoice email uses the same defaults, placeholder validation, and preview,
  with editable content before preparing the delivery.
- Freeze the resolved subject/body for each prepared delivery, including message
  language. Later template/language changes apply only to new deliveries.

Example default for an invoice with a due date:

```text
Subject: Invoice {{invoiceNumber}} from {{businessName}}

Hello {{clientName}},

Please find invoice {{invoiceNumber}} attached.

Payment is due on {{dueDate}}.

Thank you,
{{businessName}}
```

Recurring defaults can additionally include "Billing period: {{billingPeriod}}"
when that metadata is available.

### Approved deletion and retention policy

- Deleting a generated invoice does not reset or recreate its recurring occurrence.
  Retain the occurrence record as processed with an "invoice deleted" outcome, plus
  its billing-period idempotency key and delivery history. Do not cascade-delete
  recurrence or delivery audit records with the invoice.
- A schedule that has generated an invoice or delivery cannot be permanently deleted
  through normal UI. Its Delete action stops it and archives it, retaining schedule,
  occurrence, invoice-link, and delivery history. Archived schedules never run again.
- A schedule with no generated invoice, occurrence delivery, or other history may be
  permanently deleted after confirmation.
- Do not automatically age-delete saved PDFs in the first release. Preserve a sent
  PDF with its invoice/delivery history. Never delete files referenced by pending,
  retryable, outcome-unknown, or review-required deliveries. Storage cleanup and a
  configurable retention period are deferred until backup, legal, and customer
  retention requirements are established.
- If an invoice is deleted, retain its saved PDF while delivery/history policy
  requires it; clearly show that the related invoice record was deleted. Cancel
  safely unsent deliveries, including queued, retryable, and review-held emails,
  as part of deletion while preserving their history. Coordinate deletion and
  worker claims atomically; a worker must not submit a cancelled delivery.
- If submission is in flight, already accepted, or outcome-unknown, warn before
  deletion that recall cannot be guaranteed. Preserve its actual status and history,
  prevent further automatic retries, and never claim it was safely cancelled.

### Approved configurable controls and v1 operating defaults

- Expose polling interval, catch-up grace window, and generation batch limits under
  Recurring Invoices. Expose send concurrency, SMTP timeouts, maximum attempts, and
  retry delays under Delivery Providers, because they also govern manual email
  when recurrence is disabled. Persist each settings group per database; Electron
  and Docker must use the same values.
- Show recommended defaults and constrain values to validated safe ranges. Do not
  expose raw implementation details or permit settings that can disable safeguards.
- Approved initial defaults for v1:
  - Reconcile every 60 seconds, and additionally on startup, database activation,
    and Electron resume.
  - A 15-minute grace window distinguishes normal processing delay from catch-up.
  - Generate up to 10 invoice occurrences per worker pass, oldest first; retain
    remaining eligible occurrences for later passes.
  - Submit one email at a time per database, across all participating runtimes.
  - Use a 10-second connection timeout and 30-second response timeout; verify
    these defaults against supported SMTP servers during implementation.
  - Allow 5 total send attempts (initial attempt plus retries), with retry delays
    of 1, 5, 15, and 60 minutes.
- Make the scheduler interval, catch-up grace window, per-pass generation limit,
  send concurrency, SMTP timeouts, maximum attempts, and retry delays configurable
  by the database administrator in Settings. Present sensible units, bounds, and
  concise explanations; reject unsafe/out-of-range values. Changes apply to new
  work and future retry scheduling, without silently rescheduling or duplicating
  already completed work.
- Send concurrency is a database-wide limit, not a separate allowance per process
  or provider. Coordinate Electron/server workers sharing PostgreSQL through atomic
  database-backed delivery claims and concurrency slots. Renew claims while working,
  fence stale workers, and recover expired slots without duplicating submission.
  A reclaimed job whose prior SMTP acceptance cannot be ruled out becomes
  outcome-unknown for review, rather than being automatically resent.
- Check cancellation, deletion, feature gates, and current claim ownership immediately
  before submission. Test these races; an email already entering SMTP submission
  cannot be guaranteed recall. Simultaneous access to a SQLite file by separate
  editions/deployments remains unsupported.
- Keep recurrence cadence/timezone/local scheduled time, per-schedule automatic
  catch-up email preference, provider selection, and SMTP configuration in their
  respective schedule/provider UI; these remain independently configurable.
- Retry temporary network failures and SMTP 4xx responses. Treat authentication
  or TLS/configuration errors as provider-blocked until corrected, rather than
  retrying every queued message. Treat invalid recipients and permanent SMTP 5xx
  rejection as non-retryable without user action.
- Failure classification and safety rules are fixed in code; settings may adjust
  retry timing/limits but cannot turn permanent or uncertain failures into automatic
  retries. Bound all values to prevent retry storms and starvation.
- If SMTP may have accepted a message but the outcome cannot be confirmed, mark
  it outcome-unknown and require review; do not automatically retry and risk a
  duplicate. Offer “record accepted” or an explicitly authorized replacement send
  with a duplicate warning and audit record. This is distinct from ordinary manual
  retry after a definite failure or retry exhaustion.

### Approved first-release scope

- Weekly, monthly, and yearly recurrence, explicit timezone, start date/local send time,
  payment terms, optional end date, and generation-only or generate-and-email mode.
- Weekly follows the selected weekday, monthly the anchored day of month, and yearly
  the anchored month/day. Each repeats once per interval; custom intervals such as
  every two weeks or every three months are out of scope for this release.
- Yearly February 29 uses the approved non-leap February 28 fallback, retaining the
  original anchor; show it in the occurrence preview.
- End-of-month behavior anchored to the original schedule: a schedule on the 31st
  uses the last valid day in shorter months and returns to the 31st when possible.
- A recurring-schedules management page plus an invoice action to create a
  schedule. During setup, show the source invoice number, client, and invoice date;
  explain that it is a template and remains unchanged, and is not counted or sent
  as the first recurring occurrence.
- Ask the user to confirm the first new invoice's scheduled date explicitly.
  Default it to the next occurrence implied by the selected cadence and start date,
  but allow editing. Preview the first invoice date/billing period and recipient
  before activation. Do not infer which service period the source invoice covers
  from its issue date, and do not create an invoice or reserve a number in preview.
- If another active schedule uses the same source invoice, show its cadence, status,
  and next occurrence as a non-blocking duplicate/overlap warning. Allow activation
  after acknowledgement; separate schedules may intentionally represent different
  services. Never merge or silently suppress either schedule.
- Confirm activation with a summary of the first/next run and recipient.
- Schedule detail shows the next occurrence, generated invoices, delivery attempts,
  errors, and whether this runtime must stay running.
- One supported email recipient per schedule initially; use the source invoice's
  client email as an editable suggestion, not an unconfirmed sending destination.
- Multiple named SMTP configurations with host, port, TLS mode, credentials,
  sender name/address, optional Reply-To, and
  a user-initiated test email to a confirmed address in a dedicated Delivery
  Providers UI section. SMTP is the only available method; do not show placeholder
  choices for unimplemented provider types. A provider type (SMTP) is distinct
  from a configured instance (for example, "Business A email").
- A provider-neutral delivery interface accepts recipient/message data and the
  saved PDF attachment, with explicit submission results and failure categories.
  Keep SMTP-specific configuration and behavior in its adapter so additional
  providers can be added without rewriting recurrence or PDF generation.
- Recurring schedules select generation-only or email delivery through one explicit
  configured provider ID belonging to the same database. Manual email and test
  email also explicitly select a configuration; do not silently route through
  another provider if the selected one is unavailable.
- Missing/invalid SMTP configuration blocks requested delivery with an
  actionable error; it must not silently convert enabled sending to success.
- Prevent deleting a provider configuration referenced by a schedule or pending
  delivery until those references are explicitly reassigned or resolved. Provider
  replacement on a schedule affects new deliveries, not already prepared ones.
- At delivery preparation, freeze the recipient, rendered subject/body, sender
  name/address, Reply-To, selected provider ID, and saved PDF reference/filename.
  Schedule edits and provider sender/message edits apply only to future deliveries,
  including when an existing delivery is awaiting catch-up approval or retry.
- Resolve current SMTP host, port, TLS settings, and credentials for that same
  selected provider at send time, so connection/password fixes can unblock retries.
  Do not substitute current sender identity or another provider.
- To intentionally change a pending email, explicitly cancel its unsent delivery
  and prepare a replacement against the existing invoice. Confirm the new details;
  do not create another invoice or silently mutate the original delivery.
  Preserve both records. Submitted or uncertain-outcome sends cannot be treated
  as safely cancelled; warn about possible duplicate delivery before replacement.
- Stop terminally ends future generation while retaining history; restart billing
  through a new schedule. Pause suspends automatic work reversibly. Resume and edits
  show their effect on upcoming and missed occurrences.

The controls, frequencies, delivery behavior, setup confirmation, and provider
selection above are approved. Numerical defaults and schedule-edit transition details
are listed separately below.

### Out of scope

- Quotations, e-invoicing formats, payment collection, customer portals, public
  invoice links, and multi-user authentication.
- Native background services and guarantees of desktop execution while closed.
- Daily recurrence, custom intervals, arbitrary cron expressions, and complex
  recurrence rules in the first release.
- Additional delivery methods/providers in the first release and browser automation.
- Redis or another queue service unless deployment requirements justify it.
- Changing existing manual export or invoice-duplication behavior.

## Lifecycle and hold transitions

### Schedule lifecycle

| Current state                       | Action/event                      | Result and worker behavior                                                                                                                         |
| ----------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Not yet active                      | Confirm setup and Start           | Becomes active with the confirmed first occurrence. Feature flags, entitlement, and recovery holds must also permit execution.                     |
| Active                              | Pause                             | Becomes paused; no new generation or automatic delivery. Pending deliveries are suspended. Pause-period occurrences are skipped.                   |
| Paused                              | Resume                            | Becomes active; preview next run and review pending work before releasing suspended sends. Do not bill pause-period occurrences.                   |
| Active or paused                    | Stop                              | Becomes terminally stopped; no further catch-up generation or automatic delivery. History remains and pending unsent deliveries stay suspended.    |
| Stopped                             | Create new schedule from this one | Copy configuration into a new schedule with a confirmed first occurrence; do not copy jobs, occurrence identities, or replay the stopped interval. |
| Any non-archived state with history | Delete                            | Stops and archives the schedule. Retain history; archived schedules never execute again.                                                           |
| Unused schedule without history     | Confirm permanent deletion        | Remove it; no invoice/occurrence/delivery history is removed.                                                                                      |
| Active                              | Runtime downtime/restart          | Remains logically active; reconcile missed active periods using the approved catch-up policy.                                                      |
| Any retained state                  | Recurring Invoices feature off/on | Individual lifecycle state is unchanged. Apply/remove the global execution gate; do not resume individually paused/stopped schedules.              |
| Any retained state                  | Explicit restore/import           | Individual state is retained, but a persistent recovery hold blocks automatic work until reconciliation approval.                                  |

### Delivery lifecycle

Delivery progress and blocking reasons are separate. A held delivery may be prepared,
queued, or awaiting a retry; removing one hold does not override another.

| Current progress                          | Action/event                               | Result                                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Not prepared                              | Prepare email/PDF                          | Save attachment and frozen addressing/content/provider details; queue only when required approvals and gates permit. Preparation errors remain actionable and unsent. |
| Prepared/queued                           | Missed occurrence outside grace window     | Await catch-up review unless the schedule's automatic catch-up email option is enabled.                                                                               |
| Queued/retry due                          | Worker atomically claims and checks gates  | Starts submission using the selected provider and saved attachment.                                                                                                   |
| Submitting                                | SMTP confirms acceptance                   | Record submitted/accepted, not inbox-delivered or paid.                                                                                                               |
| Submitting                                | Definitely not accepted, temporary failure | Schedule bounded retry with recorded attempt count/next time.                                                                                                         |
| Submitting                                | Authentication/TLS configuration failure   | Block the selected provider's work. Correct and test the configuration, then explicitly resume affected work; editing settings alone does not resume or send.           |
| Submitting                                | Permanent rejection or attempts exhausted  | Record failure; explicit user correction/retry is required.                                                                                                           |
| Submitting                                | Acceptance uncertain                       | Record outcome-unknown; prohibit ordinary retry. Review external evidence, then record accepted or authorize a warned replacement send with an audit record.             |
| Unsent and safely cancellable             | Cancel                                     | Record cancelled; retain history. Explicitly prepare a replacement against the same invoice if needed.                                                                |
| Submitted or outcome-unknown              | Request cancellation/replacement           | Explain cancellation cannot be guaranteed; warn about duplicate delivery before explicit replacement.                                                                 |
| Safely unsent delivery                    | Delete related invoice                     | Cancel atomically against worker claims; preserve occurrence, delivery, and required PDF history.                                                                     |
| Submitting, submitted, or outcome-unknown | Delete related invoice                     | Warn that recall is not guaranteed; preserve actual status/history and block further automatic retries. Do not report safe cancellation.                              |

### Holds and their release actions

| Blocking reason                    | What remains blocked                                       | Release action                                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery Providers feature off     | All sends, retries, and test emails                        | Enable feature; review previously suspended deliveries. Generation-only occurrences do not become an automatic send backlog.                                   |
| Recurring Invoices feature off     | Recurring generation and automatic recurring sends/retries | Enable feature; preserve individual schedule states and review pre-existing pending work. Manual sending remains governed by delivery settings.                |
| Schedule paused/stopped/archived   | That schedule's automatic generation/delivery              | Resume paused schedule and review suspended sends. Stopped/archived cannot resume. Restart billing with a new schedule, not by releasing their automatic work. |
| Catch-up review required           | The affected email submission                              | Explicitly approve sending, or use the approved per-schedule unattended catch-up policy.                                                                       |
| Restore/import recovery hold       | Recurring generation and restored pending sends/retries    | Reconcile already-processed periods and obsolete deliveries; explicitly approve recovery. Toggles/restart cannot clear it.                                     |
| Provider configuration failure     | Submissions through that provider                          | Correct and test the selected provider, then explicitly resume blocked work. Editing settings alone does not resume or submit.                                    |
| Permanent failure/retry exhaustion | Automatic retry of that delivery                           | Correct the cause where needed and explicitly retry; preserve the existing invoice/PDF.                                                                        |
| Outcome unknown                    | Automatic retry                                            | Review external evidence; record accepted or authorize a warned replacement send with an audit record. Ordinary retry is prohibited.                             |
| Missing/invalid license            | Unowned Pro operations                                     | Activate a valid entitlement; do not auto-enable features or release other holds. Update-window expiry is not license invalidity.                              |

## Billing and delivery acceptance criteria

These criteria express the agreed behavior and approved v1 defaults. Any remaining
implementation detail is a gate only for its dependent slice, as listed below.

1. Only a saved invoice can create a schedule. UI and backend validation reject
   quotations even when a caller bypasses the UI.
2. Creation captures a separately editable recurring template, recipient, timezone,
   recurrence, explicit first occurrence date, payment terms, delivery mode, and a
   selected provider ID for email. Setup identifies the source invoice as an unchanged
   template that is not itself the first occurrence. It previews the first billing
   period without creating an invoice or reserving a number. Later source-invoice
   edits do not silently change the schedule. A source invoice can be paid; its
   payment records and paid state are not carried into generated invoices.
3. Users can inspect upcoming runs, start, pause, edit, resume, and stop schedules.
   Edits have an explicit effective occurrence and affect subsequent unmaterialized
   work, not existing invoices/PDFs. Older missed occurrences use their historical
   schedule configuration.
   Source deletion does not destroy captured templates or history; implement this
   through appropriate persistence relationships.
4. An occurrence creates at most one invoice, including across restarts,
   overlapping worker ticks, and retries. Allocate numbers through shared backend
   numbering logic with transactional concurrency protection.
5. Issued dates use the actual creation date; due dates come from that date and
   configured payment terms. Retain the original scheduled occurrence, billing
   period, and actual creation timestamp separately, including after downtime.
6. Schedule setup requires confirmation of the first new occurrence date and
   previews its billing period. It does not infer service coverage from the source
   invoice's issue date or count/send the source invoice as a recurring occurrence.
   Preview does not create an invoice or consume a number.
7. Each generated invoice captures its items, client/business/bank/currency data,
   layout, customization, language, and formatting inputs. The first version freezes
   the recurring template; changes require an explicit schedule edit.
8. React-PDF generation is extracted into a separate shared package consumed by the
   frontend and backend, with browser and Node entry points. Both use the same PDF
   document and financial/formatting helpers. Preserve current preview/export.
   Fonts, logos, QR codes, signatures, watermarks, custom labels, attachments, and
   multi-page layouts work in unattended generation without DOM APIs.
9. A generated PDF is durably saved before sending. All retries and downloads of
   the sent document use the same saved PDF bytes and filename. Template or settings
   changes cannot alter an already prepared delivery. This is a saved delivery
   artifact, not a new invoice-revision model; ordinary invoice editing and the
   existing unpaid/payment lifecycle remain unchanged. Clearly distinguish a
   download of the sent attachment from an export of the current invoice.
   Generation-only occurrences do not render/store PDFs automatically. Export
   renders on demand; delivery preparation renders and persists its attachment.
10. Email uses the confirmed recipient and saved PDF attachment. Rendering failure
    prevents sending; SMTP failure is visible and does not create another invoice.
11. Track invoice-generation, PDF-generation, and delivery states independently.
    Successful generation or sending never implies invoice payment.
12. Electron reconciles due work after database activation, periodically while open,
    and after resume. Docker reconciles on startup and periodically without a browser
    or active user session. Both automatically generate every missed active period,
    skip explicitly paused/disabled periods, and require review before emailing
    catch-up invoices unless per-schedule unattended catch-up was explicitly enabled.
13. Restart recovery uses persistent schedule, occurrence, and delivery records.
    Atomic claims with expiration, renewal, and stale-owner fencing prevent concurrent
    work. Send concurrency is enforced per database across participating runtimes,
    including Electron and Docker sharing PostgreSQL; history is inspectable.
    Ambiguous send outcomes are not silently classified as failures and resent.
14. Pause/stop prevents new automatic work and suspends not-yet-submitted deliveries.
    An email already submitted cannot be recalled. The UI explains in-flight work
    and requires confirmation before resuming overdue or queued sends.
15. Missing assets, invalid recipients, unavailable databases, invalid SMTP settings,
    and provider failures produce actionable errors. Nothing is reported as sent
    merely because it was queued.
16. Credentials remain backend/main-process owned, are not returned by configuration
    reads, and are redacted from logs and normal exports. Electron uses `safeStorage`/
    OS-backed encryption; Docker uses mounted secret files. The database stores
    secret references, not plaintext. Missing secrets fail closed.
17. Delivery Providers has a dedicated configuration UI and a provider-neutral
    interface supporting multiple named configurations per database. SMTP is the
    only implemented/selectable first-release type. Email-enabled schedules select
    one configuration; manual/test sends also select one. Reject cross-database
    references and never silently substitute another configuration.
    Provider-specific configuration does not leak into calendar/PDF services.
18. Settings exposes independent Delivery Providers and Recurring Invoices toggles
    using the existing feature pattern. Their state survives restart and is enforced
    in both Electron and Docker backend execution paths. Both default off when no
    saved choice exists; updates/migrations preserve explicit choices. License
    activation enables neither feature and starts no generation/sending.
19. Disabling Delivery Providers prevents submission and retries while recurrence
    still generates invoices. New occurrences are explicitly generation-only;
    re-enabling does not automatically send invoices created during that interval.
20. Disabling Recurring Invoices globally stops all schedules' new generation and
    automatic sends/retries, without deleting schedules/history or changing their
    individual paused/stopped states. Manual sending is governed only by delivery.
21. Re-enabling either feature previews the next effective action, respects individual
    schedule states, and does not silently replay suppressed periods or suspended
    deliveries. An already committed invoice or submitted email remains recorded.
22. Catch-up email approval survives restart, authorizes sending only, and defaults
    to required outside the scheduling grace window. The per-schedule automatic
    catch-up email option defaults off; within-window delays follow normal sending.
23. Persist sufficient schedule/feature lifecycle history to classify missed periods
    correctly after downtime. Delivery-disabled periods remain generation-only even
    when delivery has been re-enabled before reconciliation.
24. Provider configurations referenced by schedules or pending deliveries cannot be
    deleted without explicit reference resolution. Record the selected provider on
    each delivery; changing a schedule's provider does not reroute prepared deliveries.
25. Prepared deliveries snapshot recipient, subject/body, sender identity, Reply-To,
    provider ID, and PDF attachment reference/filename. Retries and catch-up approval
    use those snapshots, but resolve current SMTP connection settings and credentials
    for the selected provider. Ordinary edits cannot change pending message details.
26. Users can cancel an unsent delivery and explicitly prepare a replacement for the
    same invoice with reviewed details. Retain history, avoid new invoice generation,
    and handle already-submitted or uncertain outcomes with a duplicate-send warning.
27. Explicit database restore/import establishes a persistent recovery hold before
    workers access restored data. No recurring generation or restored pending send/
    retry occurs until users review and reconcile affected periods and deliveries.
    Feature toggles and restart cannot bypass the hold.
28. Normal restart follows automatic recovery without a restore hold. External file
    restores have documented stop/review steps and a manual recovery-hold action;
    automatic detection of arbitrary file replacement is not guaranteed.
29. Schedule email has translated plain-text subject/body defaults based on invoice
    language, per-schedule editing, and a resolved preview. Manual email uses the same
    resolver and preview. Only the documented six placeholders are supported.
30. Unknown/malformed placeholders and required missing values block preparation
    with actionable feedback. Default optional sentences are omitted when their data
    is absent. Preview does not allocate invoice numbers or create invoices; prepared
    deliveries retain resolved content and language unchanged.
31. Settings exposes bounded, validated controls for scheduler interval, catch-up
    grace window, per-pass generation limit, send concurrency, SMTP timeouts,
    maximum retry attempts, and retry delays. Values persist per database and are
    applied consistently by Electron and Docker. User recurrence cadence/time and
    per-schedule catch-up email approval remain separately configurable.
    Polling/grace/generation controls belong to Recurring Invoices; delivery
    concurrency/timeouts/retries belong to Delivery Providers and govern manual
    email independently of recurrence. Concurrency is database-wide.
32. Temporary SMTP errors retry with bounded backoff; provider configuration failures
    block that provider pending correction, successful test, and explicit resume;
    permanent recipient/server rejection requires user action. Uncertain acceptance
    is held for review and cannot use ordinary retry; users may record acceptance or
    authorize a replacement with a duplicate warning and audit record. Exhausted
    definitely-failed jobs expose explicit manual retry and never create a second
    invoice.
33. Safety classification cannot be weakened by settings. Configuration rejects
    out-of-range values, avoids retry storms, and changes do not duplicate completed
    work or silently mutate already scheduled retry attempts.
34. Setup warns when another active schedule uses the same source invoice, showing
    its cadence/status/next occurrence. The warning is acknowledged but non-blocking;
    both schedules remain independent and can generate their own invoices.
35. Deleting a generated invoice never regenerates that occurrence. Preserve a
    processed occurrence tombstone/idempotency key and related delivery history.
    Atomically cancel safely unsent deliveries; warn for in-flight/submitted/uncertain
    sends and prevent further automatic retries without misreporting cancellation.
36. Deleting a schedule with generated invoices or deliveries stops and archives it
    instead of permanently deleting its history. Archived schedules never execute.
    Permanent deletion is available only when no occurrence/invoice/delivery history
    exists and the user confirms.
37. First release does not automatically age-delete PDFs. Retain PDFs needed by
    pending/retryable/uncertain/review-required deliveries and preserve sent
    attachments according to the approved history policy. Invoice deletion cancels
    safely unsent deliveries but does not remove retained delivery records/PDFs or
    recall submitted email.
38. Every schedule explicitly chooses upcoming or previous billing period. Preview
    and persist cadence-anchored local start/end dates independently of issue/due
    dates, and retain the original period during catch-up. `{{billingPeriod}}` uses
    this range; calculating adjacent boundaries never generates extra occurrences.
39. Schedule edits persist an explicit effective occurrence and historical
    configurations. Preview the transition and preserve prior settings for older
    missed periods, including prices, cadence/timezone, billing approach, and delivery
    preferences. Do not rewrite processed occurrences or prepared deliveries.
40. Pause is reversible and skips pause-period occurrences. Stop is terminal and
    blocks further catch-up generation/automatic delivery. Re-enabling a feature or
    license does not resume stopped schedules or their pending emails. Creating a
    new schedule from a stopped one copies configuration only, requires a new first
    occurrence, and never copies pending jobs or replays the stopped interval.
41. Schedule setup supports weekly, monthly, and yearly frequency with an explicit
    anchor and local time/timezone. Custom intervals and daily/cron rules are not
    offered. Preview, catch-up, and billing-period calculation use the same cadence.
42. Calendar calculations preserve anchors and use the schedule timezone. Yearly
    February 29 falls back to February 28; nonexistent DST times resolve to the first
    valid instant after the gap, and repeated times run once at the first occurrence.
    Evaluate grace against the resolved scheduled instant.
43. End date includes occurrences on that local date; later processing may catch up
    those eligible occurrences but never generate dates beyond it. Activating a
    past first occurrence requires complete count/range and occurrence preview plus
    explicit confirmation, independently of catch-up email approval.

## Release and licensing acceptance criteria

1. Community builds from the public repository alone, without private packages,
   access tokens, or private registry credentials. Existing MIT functionality remains.
2. Pro-ready desktop and Docker builds compose pinned public source with private
   packages using a private manifest/lockfile. No private source or dependency entries
   are added to public manifests/lockfile.
3. The ordinary public build produces Community only and never fetches private code.
   The private build pipeline combines a pinned public commit and private packages
   into separately named Pro-ready artifacts.
4. Pro-ready free functionality works before activation. A Pro-ready user can enter
   or import a signed license to unlock included Pro code already in the build; the
   app does not download executable code during activation. Community cannot unlock
   private features by license entry and offers documented Pro-ready switching.
5. Downloads, images, app branding, and distribution notices distinguish Community
    from proprietary Pro-ready components. Community retains a first-class download.
6. A Pro-ready user can open hosted checkout and import a signed license issued only
    after verified payment. Invalid/tampered licenses are rejected with explicit
    feedback; signing keys are absent from distributed artifacts.
7. Entitlements are verified in backend/main-process execution paths, not only UI.
    Valid activation works offline and persists separately from invoice databases.
    Database restore cannot overwrite activation.
8. Owned capabilities remain usable after the update window ends, including in
    current supported releases. Later paid additions follow defined feature-release
    eligibility. Core/security updates do not require feature-update renewal.
9. License activation/renewal does not start schedules, enable operational flags,
    approve queued emails, or release recovery holds.
10. Community/Pro-ready updates use separate feeds/metadata/artifact identities.
    Tests demonstrate no accidental edition replacement.
11. Public core migrations work independently of private Pro migrations. Supported
    Community -> Pro -> Community switching preserves extension data, with explicit
    warnings or refusal for operations that cannot preserve it.
12. Packaged desktop and Docker contain required assets/runtime dependencies;
    switching instructions include backups and avoid simultaneous SQLite access.
13. Commercial terms disclose perpetual owned-feature use, the update inclusion
    period, finalized prices/tax treatment, business/installation scope, external
    SMTP costs, and offline revocation limitations. Final pricing and licensing
    policies are release decisions, not claimed as implemented.

## Open decisions and implementation details

The approved behavior above is fixed. These remaining choices are implementation
gates only for their dependent slices. Unless otherwise noted, the recommendation is
the proposed product default, not an already approved decision.

| ID | Decision and reasonable options | Recommendation | Needed before |
| -- | ------------------------------- | -------------- | ------------- |
| D1 | **Background database scope — DECIDED 2026-11-13.** Electron processes only its currently open/activated database; Docker processes one explicitly configured database. The alternatives were Docker discovery of every accessible database or a multi-database registry. | **Selected: one active/configured database per runtime.** Keep PostgreSQL sharing coordination for workers that explicitly share that database. | Resolved |
| D2 | **SMTP credential storage — DECIDED 2026-11-13.** Electron uses `safeStorage`/OS-backed encryption; Docker uses mounted secret files; the database stores references, not plaintext. | **Selected: platform-managed secrets.** Fail closed if secrets are unavailable; never fall back to plaintext. Validate Linux behavior, secret rotation, restore, and reference lifecycle during implementation. | Resolved |
| D3 | **Operational settings profile — DECIDED 2026-11-13.** Adopt the v1 defaults and safe bounds in the recommendation. | **Selected:** 60-second reconcile interval, 15-minute catch-up grace, batch of 10 occurrences, one send at a time per database, five total attempts with 1/5/15/60-minute retry delays, 10-second connect timeout, and 30-second response timeout. Bounds: interval 30-900 seconds, grace 5-60 minutes, batch 1-50, concurrency 1-5, attempts 1-5 total (initial attempt plus up to four retries), connect timeout 5-60 seconds, response timeout 10-120 seconds. Retry classification and uncertain-outcome safeguards remain fixed in code. Validate through implementation tests. | Resolved |
| D4 | **Effective-date boundary — DECIDED 2026-11-13.** The selected effective occurrence is the first occurrence under the new configuration; all earlier theoretical occurrences use the old configuration. | **Selected.** Preview the old final and new first occurrence; reject or ask the user to resolve any collision or gap rather than silently dropping/duplicating work. | Resolved |
| D5 | **Provider unblock and outcome-unknown review — DECIDED 2026-11-13.** For authentication/TLS failures, correct the selected provider, run a test, then explicitly resume blocked work; changing settings alone does not resume or send. For uncertain acceptance, external evidence may be recorded or the user may authorize a replacement with a duplicate warning and audit record. | **Selected:** explicit provider test + resume; no ordinary retry for uncertain outcomes. Preserve original attempts and never automatically resend an uncertain message. | Resolved |
| D6 | **Pro licensing and commercial terms.** Decide renewal-window timing, business/installation limits, transfer/recovery, refunds, and final offer/pricing. Options include finalizing them before any feature implementation or handling them in a separate commercial/release workstream. | **Separate release workstream.** Keep licensing enforcement and packaging out of the PDF/SMTP/recurrence foundation; finalize legal and commercial terms before offering paid downloads or checkout. | Pro commercial launch only |

### Decisions that do not block the first slice

- Shared PDF extraction can start without resolving D1-D6. Keep current renderer
  preview/export behavior and prove browser and Node rendering before worker work.
- Provider UI can be designed, but SMTP credential persistence and send execution
  should follow D2. Recurrence worker implementation should follow D1; D3 and D4
  are approved. D5 is now approved for delivery recovery UX.
- Pro composition, licensing, pricing, and edition switching remain a separate
  release track and must not add private dependencies to Community builds.

## Risks and constraints

- Reliable unattended billing requires persisted schedules and occurrences, not
  `setInterval` state. Calendar calculations must respect timezone, DST transitions,
  month ends, and an original recurrence anchor rather than drifting after downtime.
- SMTP cannot generally guarantee exactly-once email delivery. A crash after server
  acceptance but before recording success creates an uncertain outcome.
- Current server database access is request/session oriented, and cleanup closes
  inactive databases. Background jobs need authorized, durable configuration,
  independent connection ownership, and coordination with cleanup.
- SQLite and PostgreSQL are supported in the repository; migrations, atomic claims,
  numbering, and transaction behavior must be reviewed for both.
- Preview/PDF code uses Vite font imports, browser image conversion, and React
  translation hooks. Headless rendering requires shared components and explicit
  runtime adapters, not a second PDF template.
- Existing duplicate-invoice logic has its own date rules and transaction boundaries.
  Recurrence needs explicit dates and an atomic occurrence/invoice/outbox operation;
  blindly wrapping the existing service can create nested transaction problems.
- Outbound SMTP does not require public access to the admin app. Keep Docker's admin
  interface behind an authenticating proxy; this feature does not make public hosting
  safe or introduce client-level authorization.
- Feature flags are operational controls, not cosmetic navigation settings.
  Workers and queued retries must observe persisted flags across restarts and
  concurrent changes. Persist historical enable/disable and pause intervals to
  distinguish intentional suppression from runtime downtime.
- Restored history can omit externally completed billing and sends. In-app restore/
  import must establish a recovery hold independently of flags in the backup.
  Arbitrary file replacement cannot be assumed detectable.
- Backend PDF rendering can consume substantial memory; bound concurrency and keep
  the Electron UI responsive. Assess worker isolation if measurements require it.
- Saved PDFs need durable storage, access controls, backup coverage, and a retention
  policy. Do not put them in temporary or generated build directories. Automatic
  age-based cleanup is out of scope for the first release; deletion must respect
  occurrence and delivery references.

## Affected layers/files

Existing code:

- Renderer export: [useExportPdf.tsx](../apps/renderer/src/shared/hooks/fileExport/useExportPdf.tsx).
- Shared document candidate: [PDFDocument.tsx](../apps/renderer/src/pages/invoices/Preview/PDFDocument.tsx)
  and its child components.
- Asset conversion: [dataUrlFunctions.ts](../apps/renderer/src/shared/utils/dataUrlFunctions.ts).
- Labels: [usePdfTexts.ts](../apps/renderer/src/shared/hooks/pdf/usePdfTexts.ts).
- Existing feature-toggle UI: [Menu.tsx](../apps/renderer/src/pages/settings/menu/Menu.tsx).
- Invoice persistence/numbering: [invoices.ts](../packages/core/src/services/invoices.ts).
- Backend lifecycle: [main.ts](../apps/server/main.ts), [database.ts](../apps/server/database.ts),
  and [cleanup.ts](../apps/server/cleanup.ts).
- Desktop lifecycle and IPC: [main.ts](../apps/desktop/main/main.ts) and
  [preload.ts](../apps/desktop/preload/preload.ts).
- Public contracts: [packages/contracts](../packages/contracts).
- Public migration infrastructure: [migrations](../packages/core/src/migrations)
  and [build-migrations.cjs](../scripts/build-migrations.cjs); Pro schema migrations
  belong to private packages with separate tracking.
- Build/composition surfaces: [package.json](../package.json),
  [renderer Vite config](../apps/renderer/vite.config.ts),
  [Electron main Vite config](../apps/desktop/vite.main.config.ts),
  [server TypeScript build config](../apps/server/tsconfig.build.json),
  [Electron Builder config](../apps/desktop/electron-builder.yml), and
  [Dockerfile](../Dockerfile).

Proposed additions:

- A separate shared PDF package with browser/Node asset and rendering entry points;
  frontend preview/export and both backend runtimes consume it.
- Private Pro recurrence/calendar, occurrence creation, PDF preparation, and delivery
  orchestration services using public core APIs; an extensible provider interface,
  SMTP-only adapter, and persisted delivery outbox.
- Schedule and delivery contracts, matching REST and IPC surfaces, management UI,
  dedicated Delivery Providers/SMTP UI, two Settings feature toggles, and directly
  related user/deployment documentation.
- Persistence for schedules/templates, occurrences, delivery attempts, and saved-PDF
  references, plus named provider configurations and schedule/delivery provider
  references, recovery holds, and reconciliation audit records. Restore/import flows
  must initialize the hold before workers start. Final schema and migration strategy
  require maintainer review.

## Verification plan

- Build Community from a public-only checkout with no private credentials/packages.
  Build Pro from the pinned private composition and verify runtime dependencies,
  fonts, and assets in desktop and Docker artifacts.
- Verify edition-specific update metadata, switching/backups, core and Pro migration
  independence, and Community -> Pro -> Community preservation. Exercise settings,
  import/export, and deletion paths against Pro-bearing databases.
- Verify signed-license import, invalid/tampered licenses, offline startup, persistent
  activation, update-window expiry preserving owned features, and new-feature
  eligibility. Activation must not enable schedules or send emails by itself.
- Unit-test calendar behavior: leap years, 29th-31st anchors, DST gaps/overlaps,
  timezone differences, end dates, pause/resume, and schedule edits.
- Verify February 29 yearly schedules use February 28 then return to the leap-day
  anchor; DST gaps resolve to the first valid time and repeated local times generate
  once. Test inclusive end dates with reconciliation after end, schedule timezone
  independence, and past-first-date previews/confirmation without premature generation.
- Exercise desktop restart, resume, database selection/switching, offline operation,
  and Docker restart with no browser/session. Verify no accidental backlog send.
- Test SQLite and PostgreSQL occurrence uniqueness, concurrent claims, lease recovery,
  invoice-number allocation, and transactional rollback.
- Run two workers against the same PostgreSQL database and verify the shared send
  limit, claim renewal/fencing, and no duplicate submission. Exercise crashes/expired
  leases during SMTP submission; uncertain acceptance must require review.
- Generate real PDFs in Node and browser using matching inputs. Compare page count,
  visible labels, amounts, dates, layouts, and assets; independent rendering need not
  be byte-identical. Verify retry attachments are byte-identical to the saved PDF.
- Use a local SMTP test sink, not real customer addresses. Inspect MIME recipient,
  filename, attachment type, and parseable PDF contents. Test rejected recipients,
  authentication failure, timeout, uncertain acceptance, and crash recovery.
- Test quotation rejection through UI, REST, and IPC; credential redaction; source
  edits/deletion; no carried payments; pause/stop effects on queued and in-flight work.
- Verify Pause/Resume skips pause-period occurrences and reviews suspended sends.
  Verify stopped schedules never generate/send again, including after restart,
  feature toggles, or activation. Create a new schedule from a stopped one and
  verify only configuration is copied, with a confirmed new first occurrence and
  no inherited jobs or catch-up from the stopped interval.
- Delete generated invoices and verify the occurrence tombstone prevents regeneration
  and preserves delivery history. Race deletion against worker claims; safely unsent
  emails must cancel, while in-flight/submitted/uncertain sends show warnings and
  retain accurate status without automatic retry. Delete/archive used schedules and verify they never
  run again; verify permanent deletion is limited to unused schedules. Confirm no
  automatic PDF age cleanup occurs and referenced PDFs survive while delivery is
  pending, retryable, uncertain, or awaiting review.
- Test schedule creation from an existing invoice: source remains unchanged and is
  not counted as a generated occurrence; explicit first date and billing-period
  preview do not create an invoice or consume a number. Verify an active schedule
  on the same source triggers an informative, acknowledged but non-blocking warning,
  and both schedules continue independently.
- Test all four feature-toggle combinations in Electron and Docker, including
  changes while workers are running, retries, restarts, and direct REST/IPC calls.
  Verify delivery-off occurrences create invoices but no send backlog, recurrence-off
  blocks every schedule, manual sends remain independent, and re-enabling preserves
  paused/stopped states and requires review for suspended work.
- Verify new/migrated databases without choices default both features off, saved
  choices survive updates/restarts, and activation starts no work. Restored enabled
  flags must not bypass the recovery hold.
- Test several missed active periods generate separate unpaid invoices automatically,
  with actual issued dates, preserved billing periods, and due dates from payment
  terms. Verify pause/disable intervals are skipped even if toggles changed offline
  before reconciliation; delivery-off periods never become automatic email backlog.
- Test upcoming/previous period selection for weekly/monthly/yearly schedules, mid-month
  anchors, month-end/leap-year boundaries, and the first/last generated occurrence.
  Verify preview and stored ranges agree, adjacent boundary calculation does not
  create invoices, and catch-up/template resolution retain the original period
  independently of actual issue/due dates.
- Leave occurrences unmaterialized, then edit prices, taxes, cadence/timezone,
  billing approach, recipient/provider, and email/catch-up preferences effective at
  a later occurrence. Verify older catch-up uses the prior configuration, new work
  uses the new configuration, and processed occurrence identities/prepared deliveries
  remain unchanged. Test transition previews and conflicting effective-date edits.
- Test catch-up review persistence, explicit approval, unattended per-schedule opt-in
  defaulting off, and delays just inside/outside the configured grace window. Large
  backlogs must progress in bounded batches without duplicate or missing occurrences.
- Verify bounded scheduler/retry settings persist per database and are consistent in
  Electron and Docker. Verify correct settings placement and that manual send retry/
  timeout/concurrency controls work with recurrence disabled. Exercise transient, authentication/TLS, permanent
  rejection, uncertain-acceptance, and exhausted-attempt behavior. Verify provider
  configuration correction requires a successful test and explicit resume; changing
  settings alone does not submit. For uncertain acceptance, verify ordinary retry is
  unavailable and that recording acceptance or authorizing a warned replacement
  preserves the original attempt and audit history. Definite exhausted failures allow
  explicit manual retry without duplicate invoice creation.
- Verify generation-only occurrences save invoices with no PDF rendering/storage.
  Export renders on demand, and delivery preparation persists the attachment before
  sending. Delivery-off recurrence must not incur automatic PDF generation.
- Verify the first-release provider UI offers only SMTP, provider errors are explicit,
  and the adapter interface is independent of recurrence and shared PDF code.
- Configure multiple SMTP instances with distinct senders and verify each schedule,
  manual send, and test email uses its selected instance. Test invalid/cross-database
  selections, provider deletion with references, and schedule provider changes while
  deliveries are pending; no fallback or unintended rerouting is allowed.
- Queue a delivery, then change recipient, message, sender, Reply-To, and schedule
  provider selection. Verify retries/approval retain the prepared values, while new
  deliveries use edits. Verify SMTP connection/credential fixes are used on retry,
  and cancel/reprepare retains history without generating another invoice.
- Test translated default messages, all six supported placeholders, full invoice
  numbering, captured date formats, optional-value handling, and rejection of unknown/
  malformed tokens. Verify preview performs no invoice creation/number allocation and
  later content/language edits do not change prepared messages.
- Restore/import an older backup after invoices/emails have been processed. Verify
  the hold blocks generation and restored pending manual/automatic sends before any
  worker tick, persists through restarts/toggle changes, and resumes only after
  explicit reconciliation. Verify ordinary restart remains automatic and manual
  recovery-hold controls support documented external-file restore procedures.
- Build affected workspaces and Electron bundles; validate fonts/assets in a packaged
  app and Docker. Packaging changes require maintainer review.
- Run targeted tests first, then cross-runtime end-to-end coverage and documentation
  build if guide content changes.

### Evidence already collected

- `npm test -- --run apps\renderer\src\pages\invoices\Preview\__tests__\v2PdfLayout.test.tsx`
  passed: 1 file, 7 tests.
- The existing test renders real PDFs in Node but substitutes font registration.
  This establishes feasibility, not complete production PDF or delivery support.
- No feature code or database migrations have been implemented.

## Suggested delivery slices

Keep this as an umbrella feature brief; create a focused implementation task for
each slice. The normal public build remains Community. Pro-only behavior is
implemented in the private Pro workspace and composed with a pinned public commit.

1. **Shared PDF foundation — public; complete.** The extraction, package API,
   renderer migration, and verification evidence are recorded in
   [completed-slice-1-shared-pdf-foundation.md](./completed-slice-1-shared-pdf-foundation.md).
   Backend preparation/persistence and Pro feature integration remain consumer work,
   not unfinished package-extraction tasks.
2. **Pro composition seams and proof fixture — complete for the public seams and
   user-approved local Pro composition proof.** Scope, delivered seams, test/build
   evidence, limitations, and the temporary local SHA are recorded in
   [completed-slice-2-pro-composition-seams.md](./completed-slice-2-pro-composition-seams.md).
   Before durable use in a hosted private Pro repository, transfer the local
   composition workspace and replace the temporary SHA with the exact published
   public commit containing the seams.

   **Decision and recommendation**

   - Use a private build-staging overlay, not runtime plugin discovery or private
     package imports from public source. The private build checks out an exact
     public commit into a disposable staging directory, overlays private
     implementations at the documented host integration entry points and runs
     the normal public build commands there. For this dependency-free proof
     fixture, installation uses the pinned public lockfile; future private
     dependencies and their lockfile belong only in the private Pro repository.
     The public checkout and lockfile remain unchanged.
   - Keep one typed contract and one Community no-op implementation per host.
     Statically import those modules from the host; the private build replaces the
     implementation modules in its staging copy. This works with the existing
     renderer and Electron Vite builds and the server TypeScript build without
     requiring runtime loading or a public dependency on the private repository.
   - Treat the staged overlay as the supported composition mechanism for this
     slice. Do not add environment-variable-selected package imports, a generic
     plugin registry, arbitrary module loading, or a public Pro build mode.

   **Outcome and exclusions**

   - Demonstrate that a clean public checkout builds Community with no
     contributions, and that a private staged checkout can replace the three
     host implementations and bundle a small Pro proof fixture at build time.
   - Deliver only host connection points and that fixture. Do not implement
     recurring invoices, SMTP, licensing/entitlement checks, persisted Pro
     settings, migrations, or background business workers.
   - Database lifecycle callbacks are explicitly deferred to Slice 5, when the
     worker's database ownership and open/close semantics are defined. Slice 2
     must not invent those semantics.

   **Public implementation: files and behavior**

   - Add a host-local `edition/` integration contract and default implementation
     under each existing host: `apps/renderer/src/edition/`,
     `apps/desktop/main/edition/`, `apps/desktop/preload/edition/`, and
     `apps/server/edition/`. Keep React/router types in the renderer, Electron and
     IPC types in desktop, and Express types in server. Put only shared,
     serializable request/response DTOs in `@invoice-builder/contracts`.
   - Keep contribution APIs explicit and narrow; do not create a universal
     `Plugin` type. Community defaults return no renderer routes/navigation
     entries, register no additional IPC handlers or preload methods, register no
     additional server routes, and perform no lifecycle work.
   - Renderer integration may add child routes and matching navigation/settings
     entries only. The existing app shell, router choice (web versus hash),
     localization, layout, and existing routes remain host-owned. Reject route
     collisions with existing or contributed routes rather than silently
     overriding them.
   - Electron main integration may register handlers only through a host-owned
     namespaced registration function; preload exposes only typed methods under a
     dedicated `electronAPI.edition` namespace. Never expose raw `ipcMain`,
     `ipcRenderer`, or an unrestricted channel-invocation method to renderer code.
     Register exactly once during existing IPC initialization. App/database
     lifecycle hooks are not part of this slice.
   - Server integration registers routes on a host-provided router after
     authorization/session and database-context middleware are installed. It
     receives an awaited `onStarted` callback after the HTTP listener is ready and
     an awaited `onStopping` callback before databases are closed. Hook failures
     must be reported and must not be converted into success-shaped startup or
     shutdown.
   - Keep the current startup/security order: middleware before all route
     registration; Community startup and shutdown remain unchanged. The server
     hooks are limited to observing lifecycle in the proof fixture—no scheduler,
     persistent work, or database ownership is added.

   **Private proof fixture**

   - Create a private-only fixture implementation for all three hosts: a renderer
     page with a navigation/settings entry; a typed preload method backed by one
     namespaced IPC request/response; and a server endpoint with observable
     start/stop callbacks. Use a fixed test payload (for example, `edition: 'pro'`)
     and no customer data, secrets, or real feature behavior.
   - The private build script must accept an exact public commit SHA, create a
     disposable staging checkout, overlay only the documented host implementation
     files, and run dependency installation/build using private-owned configuration.
     It must fail on a missing/invalid SHA, absent overlay file, duplicate route or
     IPC registration, or failed build; it must not fall back to a floating branch.
   - Verify the fixture in renderer, Electron main/preload, and webserver dev
     workflows and production builds. Demonstrate that the composed renderer page,
     IPC method, and server route are reachable, and that the Community build
     contains none of them.
   - Store the staging orchestration, pin, and private dependencies in the private
     repository. Do not add private package names, source, credentials, or a
     private lockfile to the public repository.

   **Acceptance criteria**

   1. A clean public checkout, with no private credentials or private repository
      available, passes the Community builds: `npm run build:renderer`,
      `npm run build:desktop`, and `npm run build:webserver`.
   2. Public automated tests prove Community contributes no extra route/menu
      entry, edition IPC/preload method, or edition API route; existing app routes,
      IPC, middleware, startup, and shutdown behavior remain intact.
   3. Focused host tests prove renderer route collisions are surfaced; Electron
      handlers are namespaced and initialized once with no raw IPC bridge; server
      routes run behind the existing middleware; and server lifecycle callbacks
      run in the stated order, are awaited, and surface failures.
   4. In the user-approved local private composition workspace, the staging
      script composes the fixture against the recorded exact public snapshot SHA.
      Community and Pro production builds, the renderer and webserver dev
      workflows, and Electron main/preload development-mode builds pass. Focused
      tests prove the route, IPC/preload method, and server endpoint are reachable
      only after composition. Record the local SHA and commands in the private
      workspace README. A hosted private repository is not required for this
      local completion.
   5. No release packaging, signing, update-feed, production licensing, database
      lifecycle, schema migration, scheduling, or recurring-invoice behavior is
      required for this slice.

   **Implementation sequence and exit gate**

   1. Add the three host-local contracts and empty Community implementations,
      wire them into existing bootstraps, and add focused Community regression
      tests. Keep each host's types and tests in that host.
   2. Complete. The user-approved local private workspace contains the staging
      overlay, proof fixture, focused tests, and successful Community/Pro build
      evidence. A hosted private repository may later adopt this workspace and
      replace the temporary local SHA with a published public commit.
   3. Stop and revisit the composition design if any host requires runtime package
      discovery, a public private-package dependency, weakening of existing
      security middleware, or source changes to the pinned public commit.

   **Dependencies and risks**

   - Slice 1 is complete and supplies the public PDF package; this slice must not
     duplicate its rendering API.
   - The entry-point overlay is the recommended composition mechanism because it
     supports the current Vite and TypeScript build paths while keeping Community
     independent. The local proof validates orchestration and dependency
     resolution; durable use in a hosted private repository requires transferring
     the local workspace and pinning a published public commit.
   - Renderer navigation, Electron preload IPC, and server middleware/lifecycle
     remain separate host contracts. A successful mock of one host does not count
     as proof for the other hosts.
3. **Recurrence domain and persistence — private Pro implementation; public core
   helpers only where generally reusable.** Implement schedule and effective-dated
   configuration models, calendar/billing-period calculations, occurrence identity,
   invoice-template snapshots, transactional invoice creation/numbering, and
   Pro-owned migrations. Begin with generation-only behavior and focused tests.
   Reuse public invoice services; if a required primitive is generally useful,
   expose a narrow public API instead of copying invoice business logic into Pro.
4. **Delivery Providers and manual email — private Pro implementation; public PDF
   foundation.** Implement named SMTP configurations, approved secret references
   and runtime adapters, provider test, manual send, saved PDF attachments,
   delivery attempts, and recovery states. Apply the agreed provider-test/resume and
   uncertain-outcome rules. Keep SMTP details out of recurrence/calendar and PDF
   services. This slice may proceed alongside recurrence domain work after slices
   1-2, but automatic schedule email depends on both slices 3 and 4.
5. **Schedule UI and runtime workers — private Pro implementation connected through
   public seams.** Add schedule creation/preview and management/history UI, then
   Electron reconciliation for the active database and Docker reconciliation for
   its explicitly configured database. Implement lifecycle hooks, claims/recovery,
   catch-up review, feature gates, and automatic email. Workers depend on persisted
   recurrence/delivery models from slices 3-4; the two implementations must honor
   the same public contracts and approved database scope.
6. **End-to-end hardening — both repos and composed builds.** Verify SQLite and
   PostgreSQL migration/transaction behavior, backups/restores and recovery holds,
   secrets, PDF assets, settings toggles, claims, retry/duplicate safeguards, and
   packaged Electron/Docker behavior. Build Community from the public repo without
   private access, and build Pro-ready artifacts from the private composition.
   Packaging, CI/release, and migration changes require maintainer review.
7. **Edition and feature documentation — public and private documentation.**
   Clearly explain what is included in the free Community edition versus Pro, and
   document the Pro recurring-invoice and delivery features and their end-to-end
   behavior. Cover availability and prerequisites, schedule setup and management,
   invoice generation and PDF email delivery, feature toggles, Electron and Docker
   runtime behavior, recovery/retry and restore safeguards, and any relevant limits.
   Keep Community documentation accurate without implying Pro functionality is
   available in the public build; put Pro-only setup and operational guidance in
   the appropriate Pro documentation. Verify links and build the documentation
   site(s) affected by the changes.

**Separate licensing/release track:** define final commercial terms, implement
license issuance and local entitlement verification, and validate Pro artifact
identity, update feeds, signing, and edition/data compatibility. It may proceed in
parallel once the Pro composition is proven, but it does not block the PDF,
recurrence, or delivery foundation. Resolve D6 before a paid launch; activation
must unlock code already in a Pro-ready build and must not enable schedules or
start delivery.

Delivery coordination is recommended because PDF sharing, schema/transaction
safety, and runtime lifecycle are cross-slice dependencies. Sequence slices 1-2
first; slices 3-4 may then run in parallel where contracts allow; slice 5 follows
their persisted interfaces; slice 6 validates the complete composition; slice 7
documents the verified edition boundary and feature behavior. The feature and
recovery policies are defined well enough to begin; implementation testing will
validate platform-specific behavior and remaining engineering details.
