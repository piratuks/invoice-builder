# Agent workflow for Invoice Builder

This repository follows a lightweight BMAD-style workflow for coding tasks.

## Operating model

- Plan before coding: identify the requested outcome, affected layers, and verification steps.
- Keep changes focused: prefer a narrow implementation over broad refactors.
- Verify before claiming completion: run the relevant tests or build checks and report the result.
- Keep the handoff clear: summarize what changed, evidence gathered, and any remaining risk.

## When to use this workflow

Use this workflow for:

- new features
- bug fixes
- UI changes
- IPC or preload changes
- backend or webserver changes
- persistence or migration work

## Repository map

- Renderer/UI: src/renderer
- Electron main process: src/backend/main
- Preload bridge: src/preload/preload.ts
- Webserver: src/backend/webserver
- Database and migrations: src/backend/shared

## Default workflow

1. Read the request and identify the likely runtime layer.
2. List the files that are likely to change.
3. Implement the smallest safe solution.
4. Run the relevant verification command(s).
5. Report the outcome and any follow-up suggestions.

## Quick start (issue -> done)

Use this sequence for a typical GitHub issue:

1. `po validate <issue_summary>` - clarify user value, acceptance criteria, risks, and verification plan.
2. `delivery plan_delivery <release_goal>` - optional for multi-slice or timeline-sensitive changes.
3. `scrum plan_sprint <sprint_goal>` - optional when managing several active issues.
4. `dev develop <implementation_task>` - implement in agreed slice order and run relevant checks.
5. `qa review <implemented_task>` - verify acceptance criteria, regressions, evidence, and state progression.
6. Move state through `draft` -> `validated` -> `in-dev` -> `qa-review` -> `done`.

If the issue is small, you can skip Delivery and Scrum and run `po -> dev -> qa`.

Routing guide:

- Small issue: `po -> dev -> qa`
- Medium issue: `po -> delivery -> dev -> qa`
- Large or multi-session issue: `po -> delivery -> scrum -> dev -> qa`

Rule of thumb:

- If the work fits one implementation task, treat it as small.
- If sequencing or release-order matters, treat it as medium.
- If the work spans multiple slices, sessions, or contributors, treat it as large.

## Good default checks

- UI change: run the relevant test or build path for the renderer.
- IPC/main process change: build the Electron target.
- Webserver change: build or run the webserver target.
- Persistence change: review migration safety and run the relevant build/test path.

## Prompt templates and agents

- Use [.github/prompts/bmad-po.prompt.md](.github/prompts/bmad-po.prompt.md) for product-owner style acceptance criteria.
- Use [.github/prompts/bmad-dev.prompt.md](.github/prompts/bmad-dev.prompt.md) for implementation.
- Use [.github/prompts/bmad-qa.prompt.md](.github/prompts/bmad-qa.prompt.md) for review and verification.
- Use [.github/prompts/bmad-delivery.prompt.md](.github/prompts/bmad-delivery.prompt.md) for release planning, sequencing, and dependency-aware delivery slices.
- Use [.github/prompts/bmad-scrum.prompt.md](.github/prompts/bmad-scrum.prompt.md) for sprint-level planning and daily execution cadence.
- Custom agents in [.github/agents](.github/agents) back each role — invoke them directly as `po`, `dev`, `qa`, `delivery`, and `scrum`.

## Lightweight artifacts

- Story template: [.github/artifacts/story-template.md](.github/artifacts/story-template.md)
- Task template: [.github/artifacts/task-template.md](.github/artifacts/task-template.md)

Use these artifacts only when helpful for clarity, not as mandatory bureaucracy. Keep them concise and linked to PRs/issues.

Artifact policy:

- Do not create artifact instances by default for small issues.
- For medium or large work, let agents create or update shared artifact instances under [artifacts/README.md](artifacts/README.md).
- Preferred instance paths:
  - `artifacts/story-<issue-or-slug>.md`
  - `artifacts/task-<issue-or-slug>.md`
- PO owns initial story artifact creation when needed.
- Scrum owns task artifact creation when task-level breakdown is needed.
- Delivery, Dev, and QA should update the same shared artifact rather than creating duplicates.

## State model

Use this minimal flow for work tracking:

1. `draft` - request captured but not yet clarified
2. `validated` - PO acceptance criteria and constraints are clear
3. `in-dev` - implementation in progress
4. `qa-review` - QA is validating behavior and evidence
5. `done` - checks passed, risks documented, ready to merge/release

Suggested transition gates:

- `draft -> validated`: acceptance criteria and scope are explicit
- `validated -> in-dev`: implementation owner and target files identified
- `in-dev -> qa-review`: relevant checks/tests executed with results captured
- `qa-review -> done`: QA verdict is pass or approved with known follow-ups

## Verification expectations

- Prefer the smallest relevant check first, such as a targeted test or build step.
- If the change affects the UI, run the relevant renderer or app test coverage if available.
- If the change affects IPC or the main process, validate the build path for Electron.
- If the change affects data persistence, consider migration safety and schema impact.

## Team expectations

- Keep PRs focused.
- Prefer explanation over guesswork.
- Do not claim success without verification output.

## When to ask for human input

- Packaging, release, or installer changes.
- Database schema changes that need migration strategy.
- Large cross-cutting refactors.
