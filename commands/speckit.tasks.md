---
name: speckit.tasks
description: Decompose the plan into ordered, file-scoped tasks with tests before implementation. Structured high-volume decomposition on the balanced tier.
argument-hint: "[spec id, e.g. 001 — defaults to the newest spec]"
model: sonnet
---

# Phase 6 — Tasks

You are producing a task list someone can execute without re-reading the plan.

## Read first

1. `specs/<NNN>-<slug>/plan.md` — the source of truth for structure. Default to the highest `NNN`.
2. `specs/<NNN>-<slug>/spec.md` — the requirements each task must cover.
3. `data-model.md`, `contracts/`, `research.md`.
4. `.specify/templates/overrides/tasks-template.md`, then
   `${CLAUDE_PLUGIN_ROOT}/templates/tasks-template.md`. **The preset override wins.**

## Refuse to start when

- `plan.md` does not exist. Send the user to `/sdd-speckit:speckit.plan`.
- The Constitution check in `plan.md` has an unjustified FAIL.
- A `[NEEDS CLARIFICATION]` marker is still open in `spec.md`. This is constitution gate N4.

## Do

Delegate to the **task-planner** subagent.

1. Group tasks into the five phases in the template: Setup, Tests first, Implementation,
   Integration, Polish.
2. Put every test task in Phase 2, **before** the implementation it covers. This is gate N1. State
   in the phase header that these tests must fail before Phase 3 begins.
3. Give every task an exact file path. "Update the service" is not a task; "add `validateOrder` to
   `src/orders/validate.ts`" is.
4. Mark `[P]` only when two tasks touch different files. Two tasks on the same file are never both
   parallel.
5. Record dependencies by task id. Keep ids stable and append-only.
6. Fill the Requirement coverage table. **An empty cell is a gap** — either add a task or state in
   the report that the requirement is deferred.
7. Derive one task per contract file and one per entity in the data model.

## Write to

`specs/<NNN>-<slug>/tasks.md`

## Report

- Total tasks, and the count per phase.
- Parallelizable count.
- Requirement coverage: covered against total, and every uncovered requirement by id.
- The critical path, as a task-id chain.

Then say: run `/sdd-speckit:speckit.analyze` to check consistency, or
`/sdd-speckit:speckit.implement` to build.
