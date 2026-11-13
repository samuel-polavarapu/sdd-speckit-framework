---
name: "sdd-speckit-implement"
description: "Execute tasks.md in dependency order, tests first. Routine execution on the balanced tier; escalate to the top tier for a bug that survives two attempts."
argument-hint: "[task id or range, e.g. T004 or T004-T009 — defaults to the next unblocked task]"
disable-model-invocation: true
---

<!-- Generated from commands/speckit.implement.md by sdd-speckit-framework. Edit the source, then re-run --emit=copilot. -->

> **SDD Speckit phase `implement`.** Model tier: **sonnet**.
> Run the phase work in the custom agents **implementer**, **code-reviewer** (`.github/agents/`) as a subagent. The agent pins the model tier and the tool set.

# Phase 8 — Implement

## Templates

For every template this phase names, use `.specify/templates/overrides/<file>` when it exists,
otherwise `.specify/sdd-speckit/templates/<file>`. An override is the base template composed
with the project's industry and stack profiles, so it wins. A line of the form
`<!-- slot:… -->` is a composition marker: never copy it into an artifact.

## Read first

1. `specs/<NNN>-<slug>/tasks.md` — the execution order. Default to the feature in `.specify/.active-spec`, then to the highest `NNN`.
2. `plan.md`, `data-model.md`, `contracts/` — the design you are implementing.
3. `.specify/memory/constitution.md` — the gates you must not break.
4. The existing codebase and `AGENTS.md`. Match the conventions; do not import a new style.
5. `implementation-log-template.md`, and `specs/<NNN>-<slug>/implementation-log.md` when it
   exists.

## Refuse to start when

- `tasks.md` does not exist. Send the user to `/sdd-speckit-tasks`.
- The task named in the arguments given after the command has an unfinished dependency. Say which one.

## Do

Delegate to the **implementer** custom agent. Use **code-reviewer** after each phase.

0. Write the feature's directory name (`NNN-slug`) to `.specify/.active-spec`. The harness gates
   check every source write against that feature.
1. Work in `tasks.md` order. Respect every dependency. Run `[P]` siblings together when they truly
   touch different files.
2. **Phase 2 before Phase 3, always.** Write the test, run it, and confirm it fails for the right
   reason. A test that passes before the implementation exists is testing nothing — fix the test.
3. One task, one commit-sized change. Tick the task in `tasks.md` as you finish it, and append
   its row to `implementation-log.md`: the commit, the test evidence, and any deviation.
4. After each phase, run the full test suite. Hand the diff to **code-reviewer** before moving on.
5. **Escalation rule.** A bug that survives two focused attempts is a signal that the model tier
   is wrong for it. Stop, tell the user what you tried and what you observed, and recommend
   re-running on the top tier — say `/model opus` explicitly. Do not grind; nothing in this plugin
   can switch the model for you.
6. When the plan and the code disagree, stop and say so. The plan is wrong, or your reading is.
   Do not silently diverge. Record an accepted deviation in `implementation-log.md`.
7. **Finish with the coverage report.** Run the test command with coverage so that it writes a
   Cobertura or JaCoCo XML file, then generate the report. Never write it by hand.

   ```bash
   python3 .specify/sdd-speckit/scripts/coverage-report.py --xml <coverage xml> \
     --out specs/<NNN>-<slug>/coverage-report.md --feature <NNN>-<slug> \
     --command "<the test command>" --tests "<the result line>"
   ```

   The threshold is `harness.coverageThreshold` in `.specify/sdd-speckit.json`. Exit code 1
   means coverage is below it: add the missing tests, or report the gap. Do not lower the
   threshold.
8. **Never record an approval.** When the `human-approval` gate stops a write, show the person
   the command from its message and wait. Do not run it, and do not write under `approvals/`.
9. **When a harness gate stops a write, fix the cause.** The message names what is missing: a
   spec, a plan, a task list, a test, or a value that looks like a secret. Do not write the file
   through the shell to avoid the gate, and do not change a gate mode. Only a person does that.

## Write to

Source files per `tasks.md`, plus ticked checkboxes in `specs/<NNN>-<slug>/tasks.md`, rows in
`specs/<NNN>-<slug>/implementation-log.md`, `specs/<NNN>-<slug>/coverage-report.md` (generated), and
`.specify/.active-spec`.

Never write `.specify/memory/constitution.md`. A hook blocks it.

## Report

- Tasks completed, with ids, and what remains.
- Test result: passed, failed, skipped.
- Coverage: the line rate and the gate result from `coverage-report.md`, or "Not recorded".
- Every deviation from the plan, and why.
- Anything you escalated or want reviewed by a human.

Then say: run `/sdd-speckit-analyze` to re-check consistency, or
`/sdd-speckit-converge` when the tasks are done.
