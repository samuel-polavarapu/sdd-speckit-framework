---
name: speckit.plan
description: Turn a specification into a technical plan with architecture, data model, contracts and a quickstart. Cross-cutting design reasoning, so it runs on the top tier.
argument-hint: "[spec id, e.g. 001 — defaults to the newest spec]"
model: opus
---

# Phase 4 — Plan

You are deciding **how** to build what the spec describes. This is the first phase allowed to
name technology.

## Read first

1. `specs/<NNN>-<slug>/spec.md` — the requirements. Default to the highest `NNN`.
2. `.specify/memory/constitution.md` — the gates.
3. `.specify/templates/overrides/plan-template.md`, then
   `${CLAUDE_PLUGIN_ROOT}/templates/plan-template.md`. **A stack preset override wins over the
   base template.** Check the override path first.
4. `.claude/settings.json` → the recorded stack preset, if any.
5. The existing codebase. Reuse what is there before you introduce anything new.

## Refuse to start when

`spec.md` still contains a `[NEEDS CLARIFICATION]` marker that affects the architecture. Say which
marker, and send the user to `/sdd-speckit:speckit.clarify`. Planning around a guess wastes the
whole downstream phase.

## Do

Delegate to the **solution-architect** subagent. Use **research-scout** for every unknown, and
record what it finds in `research.md`.

1. Fill the Technical context table. Every cell gets a value or a `[NEEDS CLARIFICATION]` marker.
2. Run the Constitution check **before** you design. Record PASS or FAIL per gate.
3. Design the component view. One responsibility per component, and name what each depends on.
4. Record every decision that had a real alternative in the Key decisions table, with the
   trade-off you accepted. A decision with no alternative listed is not a decision, it is a habit.
5. Write the four companion artifacts:
   - `research.md` from `${CLAUDE_PLUGIN_ROOT}/templates/research-template.md` — one section per
     unknown, each closed with a decision.
   - `data-model.md` from `${CLAUDE_PLUGIN_ROOT}/templates/data-model-template.md` — skip only if
     the feature stores nothing, and say so.
   - `contracts/` — one file per interface. Use the real format: OpenAPI, GraphQL SDL, JSON
     Schema, or a typed CLI signature.
   - `quickstart.md` from `${CLAUDE_PLUGIN_ROOT}/templates/quickstart-template.md` — every command
     copy-pasteable, every step with an expected result.
6. Break delivery into phases, each ending in a thin vertical slice with an observable exit
   criterion.
7. Run the Constitution check **again** after designing. A gate that flipped to FAIL needs a
   justification and a rejected simpler alternative, or a redesign.

## Write to

- `specs/<NNN>-<slug>/plan.md`
- `specs/<NNN>-<slug>/research.md`
- `specs/<NNN>-<slug>/data-model.md`
- `specs/<NNN>-<slug>/contracts/`
- `specs/<NNN>-<slug>/quickstart.md`

## Report

- Every file you created, with its path.
- Which template you applied, base or preset override, and the preset id.
- The Constitution check result per gate, both runs.
- The key decisions, one line each.
- Every open question, and what it blocks.

Then say: run `/sdd-speckit:speckit.checklist` for a quality gate, or
`/sdd-speckit:speckit.tasks` to decompose.
