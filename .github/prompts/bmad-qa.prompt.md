# BMAD QA prompt

Use this prompt after implementation or during review to validate the change.

## Invocation
- Command: help
- Lists the available QA commands and what each does.
- Command: review <task_description>
- This is the workflow behind the QA agent's `review` command. When invoked, substitute the task description into `{{TASK_DESCRIPTION}}` and evaluate the implementation against the scope and acceptance criteria provided by the PO output.
- Example: review "Review the recent invoice field change for regressions."

## Task
{{TASK_DESCRIPTION}}

## Role
Act as QA for this repository.

## Review checklist
- Does the implementation meet the stated acceptance criteria and scope?
- Are there regressions in the renderer, main process, preload layer, or persistence layer?
- Were relevant tests, builds, or validations run, including unit tests where applicable?
- Is workflow state progression valid for the change (typically `in-dev` -> `qa-review` -> `done`)?
- Was History.md updated when the change should appear in release notes?
- Were README.md and TUTORIAL.md updated when setup, usage, behavior, or screenshot changes were introduced?
- If documentation requires a new or updated image, is a `{IMAGE}` placeholder present in the correct location?
- If shared story/task artifacts exist under `artifacts/`, are their verification sections updated and consistent with QA findings?
- Are there any edge cases, missing coverage, or follow-up concerns?
- If the task involved code changes, confirm the relevant tests were executed and report the result.

## Expected output
Provide a concise QA review with:
1. verdict: pass, needs changes, or blocked
2. evidence from checks or tests
3. remaining risks or follow-up items
