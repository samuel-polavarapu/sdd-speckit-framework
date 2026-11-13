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

## Before the phases: onboarding

Run `onboard` once per project. It composes the templates for the project's industry and stack,
writes `AGENTS.md`, and wires the harness gates. What comes next depends on the project mode in
`.specify/sdd-speckit.json`:

| Mode | Route |
|---|---|
| `greenfield` | `onboard` → `constitution` → `specify` … |
| `brownfield` | `onboard` → `discover` → `constitution` (derived from the discovery report) → `baseline` → `specify` … |

`discover` changes no source file. `baseline` writes as-built specs to `specs/_baseline/` and the
adoption roadmap. A baseline spec is not a feature spec: it never satisfies a gate.

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
| `onboard` | The config record, a repository scan | Composed templates, `AGENTS.md`, CI gates, harness wiring | sonnet |
| `discover` | The codebase | `.specify/discovery/report.md`, `inventory.json` | sonnet |
| `baseline` | Discovery report, constitution | `specs/_baseline/<area>/spec.md`, `.specify/adoption-roadmap.md` | opus |
| `constitution` | Existing constitution, repo conventions, discovery report | `.specify/memory/constitution.md` | opus |
| `specify` | Constitution, the request | `spec.md`, `checklists/requirements.md` | sonnet |
| `clarify` | `spec.md` | `spec.md` (markers resolved) | sonnet |
| `plan` | `spec.md`, constitution, codebase | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` | opus |
| `checklist` | `spec.md`, `plan.md` | `checklists/<kind>.md` | sonnet |
| `tasks` | `plan.md` and companions | `tasks.md` | sonnet |
| `analyze` | Everything | **nothing — read-only** | opus |
| `implement` | `tasks.md`, `plan.md` | Source code, ticked `tasks.md`, `implementation-log.md` | sonnet |
| `converge` | Spec, tasks, **shipped code** | `converge-report.md`, appended convergence tasks | opus |

Full rationale for the tiers: `docs/MODEL_ROUTING.md`.

## Templates

Every phase takes its template from `.specify/templates/overrides/` when the file is there, and
from the framework otherwise. An override is the base template composed with the project's
industry and stack profiles. Do not edit one: it is regenerated. A project rule goes in
`.specify/templates/fragments/`.

Profile content is marked by its ids: gates `G-<XX>-n`, requirements `NFR-<XX>-nn`, regulatory
tasks `R###`, stack tasks `S###`, checklist rows `C-<XX>-nn` and `C-ST-nn`.

## Harness gates

Six gates run in the assistant's hooks and in CI. Each is `off`, `warn` or `block` in
`.specify/sdd-speckit.json`.

| Gate | Stops |
|---|---|
| `constitution-guard` | A write to the constitution outside the `constitution` phase |
| `spec-before-code` | A source write when the active feature has no `spec.md` and `plan.md` |
| `tasks-before-implement` | A source write when the active feature has no tasks |
| `test-first` | A source write when the branch has no test change |
| `secrets-scan` | A credential, a key, or a value the industry profile marks as sensitive |
| `lint-format` | Lint or format failures (after the write; in CI, the full commands) |

The active feature is the one in `.specify/.active-spec`, which the phases write, or the
`NNN-slug` branch.

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
| A decision that outlives the feature | `docs/adr/` |
| What the existing system does today | `specs/_baseline/<area>/spec.md` |
| When each gate moves from warn to block | `.specify/adoption-roadmap.md` |
| Which standard requires a control | Constitution `Annex R` |
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
| A source write is blocked, and the message names a gate | Run the phase it names. Do not write through the shell to get past it. A gate mode is changed by a person, with `setup`. |
| No gate ever fires | The source globs in `.specify/sdd-speckit.json` do not match the layout. Correct them. |
| A composed template is reported stale | Run the composer again (`onboard` does it), and commit the result. |
| A constitution gate is in the way | Run `constitution` to amend it, or record a written waiver with an expiry. Never edit that file by hand — a hook blocks it. |

## Two different things named "hooks"

Keep these apart. They are unrelated.

| Name | What it is | Where it lives |
|---|---|---|
<!-- claude-only:start -->
| **Claude Code hooks** | Lifecycle event handlers — `PreToolUse`, `SessionEnd` — that run shell commands | `hooks/hooks.json` |
<!-- claude-only:end -->
<!-- copilot-only
| **GitHub Copilot hooks** | Lifecycle event handlers — `preToolUse`, `postToolUse` — that run shell commands | `.github/hooks/sdd-speckit.json` |
-->
| **Speckit extension hooks** | Extension points that Speckit extensions declare | `.specify/extensions.yml` |

## Command naming

<!-- claude-only:start -->
This plugin's commands are namespaced: `/sdd-speckit:speckit.plan`.

`specify init --integration claude` installs Speckit's own copies into `.claude/skills/`, named
with a hyphen and invoked as `/speckit-plan`. The two sets do not collide. The hyphenated form is
Speckit's own scripted workflow. The namespaced form is this plugin's, which adds a pinned model
tier and a phase-matched subagent.
<!-- claude-only:end -->
<!-- copilot-only
This framework's phases are skills in `.github/skills/`, invoked as `/sdd-speckit-plan`.

`specify init --integration copilot` installs Speckit's own copies into `.github/skills/`, named
with a hyphen and invoked as `/speckit-plan`. The two sets do not collide. The `/speckit-*` form is
Speckit's own scripted workflow. The `/sdd-speckit-*` form is this framework's, which routes the
work to a phase-matched custom agent with a pinned model tier and tool set.
-->

## More detail

`references/phases.md` — per phase: entry conditions, exit conditions, and the common failure.
