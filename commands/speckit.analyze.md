---
name: speckit.analyze
description: Read-only cross-artifact consistency report over spec, plan, data model, contracts and tasks. Holds several documents in tension, so it runs on the top tier.
argument-hint: "[spec id, e.g. 001 — defaults to the newest spec]"
model: opus
disallowed-tools: ["Write", "Edit", "NotebookEdit"]
---

# Phase 7 — Analyze (read-only)

## This command never writes

You produce a **report in the conversation** and nothing else. You do not create files, edit
files, fix what you find, or run `/speckit.tasks` to patch a gap. The `Write`, `Edit` and
`NotebookEdit` tools are removed from your tool pool for this command, so an attempt will fail —
that is intentional, not an obstacle to route around. Recommend the fix; let the user run the
phase that owns it.

## Read first

Everything in `specs/<NNN>-<slug>/`, plus `.specify/memory/constitution.md`. Default to the
highest `NNN`.

## Do

Delegate to the **qa-analyst** subagent. Check six axes.

1. **Constitution conformance** — does any artifact violate a principle or a gate?
2. **Requirement coverage** — every `spec.md` requirement traced to a `tasks.md` task, and every
   task traced back to a requirement. Report both directions; an untraceable task is scope creep.
3. **Spec against plan** — does the plan solve a different problem from the one specified? Does it
   add capability the spec never asked for?
4. **Plan against data model and contracts** — every entity in the plan present in
   `data-model.md`, every interface present in `contracts/`, and no orphan in either.
5. **Test-first ordering** — every implementation task preceded by the test task that covers it.
6. **Internal contradiction** — the same fact stated two ways across two documents. Quote both.

## Report format

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
`/sdd-speckit:speckit.implement` and accept the listed gaps; `PASS` → run
`/sdd-speckit:speckit.implement`.
