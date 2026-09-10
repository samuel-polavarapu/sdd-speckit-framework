---
name: raci-lookup
description: "Answer who is Responsible, Accountable, Consulted and Informed for a Speckit phase or artifact by reading docs/RACI.md. Use when someone asks who owns a phase, who approves an artifact, who signs off a gate, who to consult before a plan, or what Claude's role is in a phase."
---

# RACI lookup

Answer ownership questions for a Speckit phase or artifact from the project's own matrix.

## Where the matrix lives

Look in this order, and use the first one that exists:

1. `docs/RACI.md` in the current project — the team may have customized it.
2. `${CLAUDE_PLUGIN_ROOT}/docs/RACI.md` — the framework default.

Say which one you used. A project that customized its matrix and got the default answer has been
given wrong information.

## What the letters mean

| Letter | Meaning | Count per row |
|---|---|---|
| **A** | Accountable — one person answerable for the outcome, and the one who signs off | Exactly one |
| **R** | Responsible — does the work | One or more |
| **C** | Consulted — gives input before the work is final | Any number |
| **I** | Informed — told after the fact, no input expected | Any number |

`A/R` means the same role is both accountable and doing the work.

## How to answer

1. Match the request to a row. Accept a phase name (`plan`), a command
   (`/sdd-speckit:speckit.plan`), or an artifact (`plan.md`) — all three name the same row.
2. Return the row as a short table: role, letter, and what that means for this phase.
3. Lead with **A**, since that is almost always the real question.
4. When the request names no phase, ask which phase. Do not return the whole matrix as an answer.
5. When no row matches, say so and list the rows that exist. Do not invent an assignment.

## The Claude column

`docs/RACI.md` has a column for Claude as the AI agent. It is **R (drafts)** for most phases and
**R (executes)** for implement — never **A**. Accountability stays with a human, which is
constitution gate N3.

If someone asks whether Claude can approve an artifact, the answer is no, and the reason is that
gate.

## Answer shape

```
Phase: <name>   (source: docs/RACI.md)

| Role | RACI | Means |
| <Accountable role> | A | Signs off. Answerable for the outcome. |
| ... | | |

Sign-off: <role>
```
