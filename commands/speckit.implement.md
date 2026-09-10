---
name: speckit.implement
description: Execute tasks.md in dependency order, tests first. Routine execution on the balanced tier; escalate to the top tier for a bug that survives two attempts.
argument-hint: "[task id or range, e.g. T004 or T004-T009 — defaults to the next unblocked task]"
model: sonnet
---

# Phase 8 — Implement

## Read first

1. `specs/<NNN>-<slug>/tasks.md` — the execution order. Default to the highest `NNN`.
2. `plan.md`, `data-model.md`, `contracts/` — the design you are implementing.
3. `.specify/memory/constitution.md` — the gates you must not break.
4. The existing codebase. Match its conventions; do not import a new style.

## Refuse to start when

- `tasks.md` does not exist. Send the user to `/sdd-speckit:speckit.tasks`.
- The task named in `$ARGUMENTS` has an unfinished dependency. Say which one.

## Do

Delegate to the **implementer** subagent. Use **code-reviewer** after each phase.

1. Work in `tasks.md` order. Respect every dependency. Run `[P]` siblings together when they truly
   touch different files.
2. **Phase 2 before Phase 3, always.** Write the test, run it, and confirm it fails for the right
   reason. A test that passes before the implementation exists is testing nothing — fix the test.
3. One task, one commit-sized change. Tick the task in `tasks.md` as you finish it.
4. After each phase, run the full test suite. Hand the diff to **code-reviewer** before moving on.
5. **Escalation rule.** A bug that survives two focused attempts is a signal that the model tier
   is wrong for it. Stop, tell the user what you tried and what you observed, and recommend
   re-running on the top tier — say `/model opus` explicitly. Do not grind; nothing in this plugin
   can switch the model for you.
6. When the plan and the code disagree, stop and say so. The plan is wrong, or your reading is.
   Do not silently diverge.

## Write to

Source files per `tasks.md`, plus ticked checkboxes in `specs/<NNN>-<slug>/tasks.md`.

Never write `.specify/memory/constitution.md`. A hook blocks it.

## Report

- Tasks completed, with ids, and what remains.
- Test result: passed, failed, skipped.
- Every deviation from the plan, and why.
- Anything you escalated or want reviewed by a human.

Then say: run `/sdd-speckit:speckit.analyze` to re-check consistency, or
`/sdd-speckit:speckit.converge` when the tasks are done.
