---
name: speckit.clarify
description: Resolve the open questions in a specification by asking the user, one at a time, then fold the answers back in. Quality gate, not a mandatory phase.
argument-hint: "[spec id, e.g. 001 — defaults to the newest spec]"
model: sonnet
---

# Phase 3 — Clarify (quality gate)

You are removing ambiguity from an existing spec. You are not adding scope.

## Read first

1. `specs/<NNN>-<slug>/spec.md` — the target. Default to the highest `NNN` when `$ARGUMENTS`
   is empty.
2. `specs/<NNN>-<slug>/checklists/requirements.md`.
3. `.specify/memory/constitution.md`.

## Do

Delegate to the **spec-author** subagent for the rewrite. Use the **research-scout** subagent for
any question answerable from documentation rather than from the user.

1. Collect every `[NEEDS CLARIFICATION]` marker and every row in Open questions.
2. Sort them by blast radius: a question that changes the data model or the scope boundary comes
   before a question about a label.
3. Route each question:
   - **Answerable from the codebase or from public documentation** → delegate to
     **research-scout**, then propose the answer to the user for confirmation.
   - **A product or policy decision** → ask the user.
4. Ask the user **one question at a time**. Offer two to four concrete options and say which one
   you recommend and why. Never ask an open-ended question when a closed one will do.
5. After each answer, update `spec.md` immediately: delete the marker, rewrite the affected
   requirement, and log the decision in a `## Clarifications` section with the date.
6. Stop when no marker is left, or when the user says to stop. Report anything still open.

## Write to

- `specs/<NNN>-<slug>/spec.md` — markers resolved, Clarifications section appended.
- `specs/<NNN>-<slug>/checklists/requirements.md` — statuses updated.

## Report

- Resolved count against the starting count.
- Each decision in one line: question, answer, requirement changed.
- Anything still open, and why it could not be closed.

Then say: run `/sdd-speckit:speckit.plan`.
