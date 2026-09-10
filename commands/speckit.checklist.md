---
name: speckit.checklist
description: Generate a custom quality checklist that gates a phase — security, accessibility, release readiness, or a domain concern. Pattern-following work on the balanced tier.
argument-hint: "<checklist kind, e.g. security | accessibility | release> [spec id]"
model: sonnet
---

# Phase 5 — Checklist (quality gate)

You are producing a gate that a human signs off. Items must be answerable yes or no.

## Read first

1. `specs/<NNN>-<slug>/spec.md` and `plan.md`. Default to the highest `NNN`.
2. `.specify/memory/constitution.md` — Article III sets the quality bar this checklist enforces.
3. `${CLAUDE_PLUGIN_ROOT}/templates/checklist-template.md`.
4. `specs/<NNN>-<slug>/checklists/` — do not duplicate a checklist that already exists.

## Do

Delegate to the **qa-analyst** subagent.

1. Take the kind from `$ARGUMENTS`. With no argument, ask which kind, and offer the kinds the
   constitution's quality bar implies.
2. Derive items from the artifacts in front of you, not from a generic list. Every item must trace
   to a requirement, a gate, or a plan decision. An item that traces to nothing is noise — drop it.
3. Phrase each item so the answer is yes or no. Replace "is the code secure" with "does every
   endpoint in `contracts/` reject an unauthenticated request".
4. Name the phase this checklist gates, in the Gates field.
5. Leave every Status cell unchecked. **You do not answer your own checklist** — a human does.
6. Keep it to fifteen items at most. A checklist nobody finishes gates nothing.

## Write to

`specs/<NNN>-<slug>/checklists/<kind>.md`

## Report

- The path, the kind, and the item count.
- Which phase it gates.
- Any requirement or gate you could not turn into a checkable item, and why.

Then say: a human answers the checklist, then run `/sdd-speckit:speckit.tasks`.
