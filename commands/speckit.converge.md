---
name: speckit.converge
description: Assess how far the built code has drifted from the specification and emit gap-filling tasks. Holds code and several documents in tension, so it runs on the top tier.
argument-hint: "[spec id, e.g. 001 — defaults to the newest spec]"
model: opus
---

# Phase 9 — Converge

You are closing the loop: the spec says one thing, the code does another, and you name the delta.

## Read first

1. `specs/<NNN>-<slug>/spec.md`, `plan.md`, `tasks.md`. Default to the highest `NNN`.
2. The **implemented source code**, not the plan's description of it. Read what shipped.
3. `.specify/memory/constitution.md`.
4. The test suite, and its most recent result.

## Do

Delegate to **qa-analyst** for the assessment and **code-reviewer** for the code read.

1. For every requirement in `spec.md`, find the code that satisfies it. Classify:
   - **Implemented** — code exists and a test covers it.
   - **Partial** — code exists, no test, or the test does not cover the acceptance scenario.
   - **Missing** — no code.
   - **Drifted** — code exists and behaves differently from the requirement. Quote both.
2. Find code with no requirement behind it. That is either undocumented scope or dead code. Say
   which you think it is.
3. Check the constitution gates against the shipped state, not the intended state.
4. Append gap-filling tasks to `tasks.md` as a new `## Phase 6 — Convergence` section. Keep ids
   append-only, continuing from the highest existing id. Tests before fixes, as always.

## Write to

`specs/<NNN>-<slug>/tasks.md` — appended convergence phase only. Do not rewrite earlier phases,
and do not edit `spec.md`; if the spec is what is wrong, say so and send the user to
`/sdd-speckit:speckit.specify`.

## Report

```
## Convergence report — specs/<NNN>-<slug>

| Status | Count | Requirements |
| Implemented | n | ... |
| Partial | n | ... |
| Missing | n | ... |
| Drifted | n | ... |

Convergence: n/N requirements fully implemented and tested.
Code with no requirement: <paths>
Constitution gates against shipped state: <per gate>
Tasks appended: T0xx-T0yy
```

Then say: run `/sdd-speckit:speckit.implement` to work the convergence tasks, or accept the
remaining gaps in writing.
