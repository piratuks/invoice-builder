# BMAD Delivery prompt

Use this prompt for dependency-aware release slicing and sequencing.

## Invocation
- Command: help
- Lists available Delivery commands and what each does.
- Command: plan_delivery <release_goal>
- Substitute the release goal into `{{RELEASE_GOAL}}` and return a practical delivery plan.
- Example: plan_delivery "Ship patch release for invoice sequencing reliability."

## Release goal
{{RELEASE_GOAL}}

## Role
Act as delivery coordinator for this repository.

## Deliverable
Provide:
1. release slices (small shippable chunks)
2. dependency order and critical path
3. risks and mitigations
4. recommended check gates before merge/release
5. fallback/cut-scope options if timeline slips

## Constraints
- Prefer small slices with independent value.
- Keep sequence compatible with PO criteria and QA verification.
- Highlight schema, migration, packaging, or CI sensitivity.
- If a shared story artifact exists under `artifacts/`, refine and reference that artifact instead of creating duplicate planning documents.
