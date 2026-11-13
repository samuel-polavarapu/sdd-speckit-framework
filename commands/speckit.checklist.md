---
name: speckit.checklist
description: Generate a custom quality checklist that gates a phase — security, accessibility, release readiness, or a domain concern. Pattern-following work on the balanced tier.
argument-hint: "<checklist kind, e.g. security | accessibility | release> [spec id]"
model: sonnet
---

# Phase 5 — Checklist (quality gate)

You are producing a gate that a human signs off. Items must be answerable yes or no.

## Templates

For every template this phase names, use `.specify/templates/overrides/<file>` when it exists,
otherwise `${CLAUDE_PLUGIN_ROOT}/templates/<file>`. An override is the base template composed
with the project's industry and stack profiles, so it wins. A line of the form
`<!-- slot:… -->` is a composition marker: never copy it into an artifact.

## Read first

1. `specs/<NNN>-<slug>/spec.md` and `plan.md`. Default to the feature in `.specify/.active-spec`, then to the highest `NNN`.
2. `.specify/memory/constitution.md` — Article III sets the quality bar this checklist enforces.
3. `checklists/<kind>-template.md` for the kind asked for. Kinds with a template:
   `requirements`, `security`, `privacy`, `accessibility`, `release`, plus each kind the
   project's industry profile adds (list `.specify/templates/overrides/checklists/`). For any
   other kind, use `checklist-template.md`.
4. `specs/<NNN>-<slug>/checklists/` — do not duplicate a checklist that already exists.

## Do

Delegate to the **qa-analyst** subagent.

1. Take the kind from `$ARGUMENTS`. With no argument, ask which kind, and offer the kinds with a
   template first, then the kinds the constitution's quality bar implies.
2. Start from the kind's template. Keep every item it carries, including the profile rows
   `C-<XX>-nn` and `C-ST-nn`: an item that does not apply to this feature stays, and the human
   marks it not applicable with the reason. Then add items derived from the artifacts in front
   of you. Every added item must trace to a requirement, a gate, or a plan decision. An item that
   traces to nothing is noise — drop it.
3. Phrase each item so the answer is yes or no. Replace "is the code secure" with "does every
   endpoint in `contracts/` reject an unauthenticated request".
4. Name the phase this checklist gates, in the Gates field.
5. Leave every Status cell unchecked. **You do not answer your own checklist** — a human does.
6. Add ten items of your own at most. A checklist nobody finishes gates nothing.

## Write to

`specs/<NNN>-<slug>/checklists/<kind>.md`

## Report

- The path, the kind, and the item count.
- Which phase it gates.
- Any requirement or gate you could not turn into a checkable item, and why.

Then say: a human answers the checklist, then run `/sdd-speckit:speckit.tasks`.
