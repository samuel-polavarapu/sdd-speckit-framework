---
name: speckit-workflow
description: "Reference for the Spec-Driven Development phase sequence — which /speckit command to run next, what each one reads and writes, which gates are mandatory, and how to recover when a phase was skipped. Use when someone asks what comes next, why a phase is blocked, which artifact holds a given fact, or how the SDD workflow fits together."
---

# The Speckit workflow

Nine phases. Artifacts flow forward; each phase reads what the phase before it wrote.

```
constitution → specify → clarify → plan → checklist → tasks → analyze → implement → converge
                 └─ required ─┘      ▲       ▲                  ▲
                                     └───────┴─ optional gates ─┘
```

## Only one ordering rule is strict

**`specify` must precede `plan`.** Everything else is either a quality gate or a recovery step.

| Phase | Mandatory? | Skip it when |
|---|---|---|
| `constitution` | Once per project | Already ratified, and unchanged |
| `specify` | **Yes** | Never |
| `clarify` | Gate | No clarification marker is open |
| `plan` | **Yes** | Never |
| `checklist` | Gate | The constitution's quality bar needs no extra gate |
| `tasks` | **Yes** | Never |
| `analyze` | Gate | The feature spans one artifact and one file |
| `implement` | **Yes** | Never |
| `converge` | Gate | Nothing shipped yet |

Skipping a gate is a decision, not an oversight. Say which gate and why.

## What each phase reads and writes

| Phase | Reads | Writes | Tier |
|---|---|---|---|
| `constitution` | Existing constitution, repo conventions | `.specify/memory/constitution.md` | opus |
| `specify` | Constitution, the request | `spec.md`, `checklists/requirements.md` | sonnet |
| `clarify` | `spec.md` | `spec.md` (markers resolved) | sonnet |
| `plan` | `spec.md`, constitution, codebase | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` | opus |
| `checklist` | `spec.md`, `plan.md` | `checklists/<kind>.md` | sonnet |
| `tasks` | `plan.md` and companions | `tasks.md` | sonnet |
| `analyze` | Everything | **nothing — read-only** | opus |
| `implement` | `tasks.md`, `plan.md` | Source code, ticked `tasks.md` | sonnet |
| `converge` | Spec, tasks, **shipped code** | Appended convergence tasks | opus |

Full rationale for the tiers: `docs/MODEL_ROUTING.md`.

## Where a fact lives

Ask "which document owns this?" before writing it anywhere.

| The fact | Owned by |
|---|---|
| A principle or a merge gate | `constitution.md` |
| What the user needs, and why | `spec.md` |
| A technology choice, and its alternatives | `plan.md` |
| Why an unknown resolved the way it did | `research.md` |
| A field, a type, an invariant | `data-model.md` |
| An interface shape | `contracts/` |
| How to run it locally | `quickstart.md` |
| Who does what, in what order | `tasks.md` |

A fact in two documents will drift. `analyze` exists to find that drift.

## Recovery

| Situation | Do this |
|---|---|
| `plan` refuses to run | An architectural clarification marker is open. Run `clarify`. |
| `tasks` refuses to run | No `plan.md`, or a constitution gate fails without justification. |
| `analyze` reports `BLOCKED` | Run the fix command it names. Do not implement past a blocking finding. |
| Code drifted from the spec | Run `converge`. It appends gap-filling tasks. |
| The spec itself was wrong | Run `specify` again on the same id, then `analyze`. Do not patch the code to match a wrong spec. |
| A constitution gate is in the way | Run `constitution` to amend it, or record a written waiver with an expiry. Never edit that file by hand — a hook blocks it. |

## Two different things named "hooks"

Keep these apart. They are unrelated.

| Name | What it is | Where it lives |
|---|---|---|
| **Claude Code hooks** | Lifecycle event handlers — `PreToolUse`, `SessionEnd` — that run shell commands | `hooks/hooks.json` |
| **Speckit extension hooks** | Extension points that Speckit extensions declare | `.specify/extensions.yml` |

## Command naming

This plugin's commands are namespaced: `/sdd-speckit:speckit.plan`.

`specify init --integration claude` installs Speckit's own copies into `.claude/skills/`, named
with a hyphen and invoked as `/speckit-plan`. The two sets do not collide. The hyphenated form is
Speckit's own scripted workflow. The namespaced form is this plugin's, which adds a pinned model
tier and a phase-matched subagent.

## More detail

`references/phases.md` — per phase: entry conditions, exit conditions, and the common failure.
