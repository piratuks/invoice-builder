# Shared artifacts

This folder stores optional working artifacts for medium and large issues.

Use artifact instances only when the work is complex enough to benefit from a shared handoff document across PO, Delivery, Scrum, Dev, and QA.

## Conventions

- Story artifact: `artifacts/story-<issue-or-slug>.md`
- Task artifact: `artifacts/task-<issue-or-slug>.md`

## Ownership

- PO creates or updates the initial story artifact when needed.
- Scrum creates or updates the task artifact when task-level coordination is needed.
- Delivery refines sequencing, dependencies, and release risk in the same artifact set.
- Dev updates implementation and verification checklist sections.
- QA updates verification outcome and findings consistency.

## Default rule

Do not create artifact instances for every issue. For small issues, use chat output only.
