---
name: "sdd-speckit-tasks"
description: "Decompose the plan into ordered, file-scoped tasks with tests before implementation. Structured high-volume decomposition on the balanced tier."
argument-hint: "[spec id, e.g. 001 — defaults to the newest spec]"
disable-model-invocation: true
---

<!-- Generated from commands/speckit.tasks.md by sdd-speckit-framework. Edit the source, then re-run --emit=copilot. -->

> **SDD Speckit phase `tasks`.** Model tier: **sonnet**.
> Run the phase work in the custom agent **task-planner** (`.github/agents/`) as a subagent. The agent pins the model tier and the tool set.

# Phase 6 — Tasks

You are producing a task list someone can execute without re-reading the plan.

## Templates

For every template this phase names, use `.specify/templates/overrides/<file>` when it exists,
otherwise `.specify/sdd-speckit/templates/<file>`. An override is the base template composed
with the project's industry and stack profiles, so it wins. A line of the form
`<!-- slot:… -->` is a composition marker: never copy it into an artifact.

## Read first

1. `specs/<NNN>-<slug>/plan.md` — the source of truth for structure. Default to the feature in `.specify/.active-spec`, then to the highest `NNN`.
2. `specs/<NNN>-<slug>/spec.md` — the requirements each task must cover.
3. `data-model.md`, `contracts/`, `research.md`.
4. `tasks-template.md`. Check the override path first.

## Refuse to start when

- The `human-approval` gate stops the write to `tasks.md`. A person approves the plan first:
  show them the command from the gate's message and wait. Never run it yourself.

- `plan.md` does not exist. Send the user to `/sdd-speckit-plan`.
- The Constitution check in `plan.md` has an unjustified FAIL.
- A `[NEEDS CLARIFICATION]` marker is still open in `spec.md`. This is constitution gate N4.

## Do

Delegate to the **task-planner** custom agent.

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
8. Keep the blocks a profile added: stack tasks `S###` and regulatory tasks `R###`. Give each row
   its real file path and its dependencies. When a row does not apply to this feature, keep the
   id and write the reason in place of the path. Add the profile's `NFR-<XX>-nn` requirements to
   the coverage table.
9. End Phase 5 with the verification tasks, in this order. Leave one out only when its artifact
   does not exist, and say so in the report.
   - **Contract drift test** — a test that fails when the running service and
     `contracts/openapi.json` disagree. Only for a service with an HTTP interface.
   - **Diagram verification** — check each row of the Verification table in `architecture.md`
     against the code, and correct the diagram or the code.
   - **Coverage report** — run the tests with coverage and generate `coverage-report.md`.
10. Write the feature's directory name to `.specify/.active-spec`.

## Write to

`specs/<NNN>-<slug>/tasks.md`

## Report

- Total tasks, and the count per phase.
- Parallelizable count.
- Requirement coverage: covered against total, and every uncovered requirement by id.
- The critical path, as a task-id chain.

Then say: run `/sdd-speckit-analyze` to check consistency, or
`/sdd-speckit-implement` to build.
