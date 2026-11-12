---
name: "sdd-speckit-plan"
description: "Turn a specification into a technical plan with architecture, data model, contracts and a quickstart. Cross-cutting design reasoning, so it runs on the top tier."
argument-hint: "[spec id, e.g. 001 — defaults to the newest spec]"
disable-model-invocation: true
---

<!-- Generated from commands/speckit.plan.md by sdd-speckit-framework. Edit the source, then re-run --emit=copilot. -->

> **SDD Speckit phase `plan`.** Model tier: **opus**.
> Run the phase work in the custom agents **solution-architect**, **research-scout** (`.github/agents/`) as a subagent. The agent pins the model tier and the tool set.

# Phase 4 — Plan

You are deciding **how** to build what the spec describes. This is the first phase allowed to
name technology.

## Read first

1. `specs/<NNN>-<slug>/spec.md` — the requirements. Default to the highest `NNN`.
2. `.specify/memory/constitution.md` — the gates.
3. `.specify/templates/overrides/plan-template.md`, then
   `.specify/sdd-speckit/templates/plan-template.md`. **A stack preset override wins over the
   base template.** Check the override path first.
4. `.specify/sdd-speckit.json` → `stack`, the recorded stack preset, if any.
5. The existing codebase. Reuse what is there before you introduce anything new.

## Refuse to start when

`spec.md` still contains a `[NEEDS CLARIFICATION]` marker that affects the architecture. Say which
marker, and send the user to `/sdd-speckit-clarify`. Planning around a guess wastes the
whole downstream phase.

## Do

Delegate to the **solution-architect** custom agent. Use **research-scout** for every unknown, and
record what it finds in `research.md`.

1. Fill the Technical context table. Every cell gets a value or a `[NEEDS CLARIFICATION]` marker.
2. Run the Constitution check **before** you design. Record PASS or FAIL per gate.
3. Design the component view. One responsibility per component, and name what each depends on.
4. Record every decision that had a real alternative in the Key decisions table, with the
   trade-off you accepted. A decision with no alternative listed is not a decision, it is a habit.
5. Write the four companion artifacts:
   - `research.md` from `.specify/sdd-speckit/templates/research-template.md` — one section per
     unknown, each closed with a decision.
   - `data-model.md` from `.specify/sdd-speckit/templates/data-model-template.md` — skip only if
     the feature stores nothing, and say so.
   - `contracts/` — one file per interface. Use the real format: OpenAPI, GraphQL SDL, JSON
     Schema, or a typed CLI signature.
   - `quickstart.md` from `.specify/sdd-speckit/templates/quickstart-template.md` — every command
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

Then say: run `/sdd-speckit-checklist` for a quality gate, or
`/sdd-speckit-tasks` to decompose.
