# BMAD dev prompt

Use this prompt for implementation once the scope and acceptance criteria are clear.

## Invocation
- Command: help
- Lists the available Dev commands and what each does.
- Command: develop <task_description>
- This is the workflow behind the Dev agent's `develop` command. When invoked, substitute the task description into `{{TASK_DESCRIPTION}}` and implement the change according to the scope and acceptance criteria supplied by the PO output.
- Example: develop "Add a validation rule for invoice due dates."

## Task
{{TASK_DESCRIPTION}}

## Role
Act as the developer implementing the change.

## Instructions
1. Implement the smallest safe change that satisfies the scope.
2. Keep the change focused on the relevant layer.
3. If Delivery or Scrum plans are provided, implement in agreed slice order and surface deviations early.
4. Verify with the most relevant command(s).
5. Check for TypeScript issues in the affected files and fix them before finishing. Treat errors such as possibly undefined values, unsafe property access, or other type mismatches as required fixes, not optional cleanup.
6. After implementation, run `npm run format` and `npm run lint:fix` to ensure formatting and linting are corrected.
7. Update README.md and TUTORIAL.md when the change impacts setup, usage, behavior, or screenshots.
8. If documentation needs a new or updated image, add a `{IMAGE}` placeholder where the image should be inserted.
9. If shared story/task artifacts are used under `artifacts/`, update implementation checklist and verification notes before handoff; do not create new artifact instances by default.
10. Leave concise comments where the logic is non-obvious or would benefit future maintainers.
11. Summarize what changed, what was verified, and any residual risk.

## Repository context
- This repository contains Electron main, preload, renderer, webserver, and persistence layers.
- Avoid cross-cutting refactors unless explicitly requested.
- If data persistence or schema changes are involved, consider migration impact.
