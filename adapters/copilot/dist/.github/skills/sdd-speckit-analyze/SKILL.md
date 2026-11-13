---
name: "sdd-speckit-analyze"
description: "Read-only cross-artifact consistency report over spec, plan, data model, contracts and tasks. Holds several documents in tension, so it runs on the top tier."
argument-hint: "[spec id, e.g. 001 — defaults to the newest spec]"
disable-model-invocation: true
---

<!-- Generated from commands/speckit.analyze.md by sdd-speckit-framework. Edit the source, then re-run --emit=copilot. -->

> **SDD Speckit phase `analyze`.** Model tier: **opus**.
> Run the phase work in the custom agent **qa-analyst-readonly** (`.github/agents/`) as a subagent. The agent pins the model tier and the tool set.
> **Read-only.** **qa-analyst-readonly** has no file-editing tool. Do not edit files in the main conversation either: produce the report and stop.

# Phase 7 — Analyze (read-only)

## This command never writes

You produce a **report in the conversation** and nothing else. You do not create files, edit
files, fix what you find, or run `/sdd-speckit-tasks` to patch a gap. Recommend the fix; let the
user run the phase that owns it.


## Read first

Everything in `specs/<NNN>-<slug>/`, plus `.specify/memory/constitution.md`. Default to the
feature in `.specify/.active-spec`, then to the highest `NNN`.

## Do

Delegate to the **qa-analyst-readonly** custom agent. Check seven axes.

1. **Constitution conformance** — does any artifact violate a principle or a gate?
2. **Requirement coverage** — every `spec.md` requirement traced to a `tasks.md` task, and every
   task traced back to a requirement. Report both directions; an untraceable task is scope creep.
3. **Spec against plan** — does the plan solve a different problem from the one specified? Does it
   add capability the spec never asked for?
4. **Plan against data model and contracts** — every entity in the plan present in
   `data-model.md`, every interface present in `contracts/`, and no orphan in either.
5. **Test-first ordering** — every implementation task preceded by the test task that covers it.
6. **Internal contradiction** — the same fact stated two ways across two documents. Quote both.
7. **Profile controls** — when the templates carry an industry or stack profile: every
   `NFR-<XX>-nn`, every gate `G-<XX>-n` and every `R###` or `S###` task is either traced to
   work or marked not applicable with a reason. A profile section left as a placeholder is a
   finding.

## Report format

The full layout is `analyze-report-template.md` (in `.specify/templates/overrides/` when a
profile overlays it, otherwise in `.specify/sdd-speckit/templates/`). Its outline:

```
## Consistency report — specs/<NNN>-<slug>

Verdict: PASS | PASS WITH GAPS | BLOCKED

### Blocking findings
| # | Axis | Finding | Artifacts | Fix with |

### Non-blocking findings
| # | Axis | Finding | Artifacts | Fix with |

### Coverage
Requirements: n/N covered. Uncovered: FR-00x, ...
Tasks with no requirement: T0xx, ...

### Clean
- <axis>: no finding
```

Every finding names the artifacts it spans and the command that fixes it. Quote the conflicting
text; do not paraphrase it.

## Report

Close with the verdict, then: `BLOCKED` → run the named fix command; `PASS WITH GAPS` → run
`/sdd-speckit-implement` and accept the listed gaps; `PASS` → run
`/sdd-speckit-implement`.
