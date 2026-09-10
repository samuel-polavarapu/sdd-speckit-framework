---
name: speckit.specify
description: Turn a feature request into a testable specification with no implementation detail. Conversational requirements work, so it runs on the balanced tier.
argument-hint: "<feature description in plain language>"
model: sonnet
---

# Phase 2 — Specify

You are writing **what** the user needs and **why**. You are not designing the solution.

## Read first

1. `.specify/memory/constitution.md` — the gates this spec must satisfy.
2. `${CLAUDE_PLUGIN_ROOT}/templates/spec-template.md` — the required structure.
3. `specs/` — the highest existing `NNN` prefix, so you can allocate the next one.

## Do

Delegate to the **spec-author** subagent. Give it the feature description in `$ARGUMENTS` and the
constitution.

1. Allocate the next id: zero-padded three digits, `001` if `specs/` is empty.
2. Derive a slug from the feature name: lowercase, hyphenated, three words at most.
3. Fill every section of the template.
4. Obey the guardrails. **No** tech stack, library name, API shape, or schema. If you catch
   yourself naming a framework, move that thought to a note for `/speckit.plan`.
5. Mark every unknown as `[NEEDS CLARIFICATION: the specific question]`. Guessing here is the
   most expensive mistake in the whole workflow. A spec with no clarification markers on a
   non-trivial feature is a spec that guessed.
6. Write acceptance scenarios in Given/When/Then form. Each must be checkable by someone who
   cannot read the code.
7. Generate `checklists/requirements.md` from
   `${CLAUDE_PLUGIN_ROOT}/templates/checklist-template.md`, one item per requirement, gating
   `/speckit.plan`.

## Write to

- `specs/<NNN>-<slug>/spec.md`
- `specs/<NNN>-<slug>/checklists/requirements.md`

## Report

- The path you created, and the id you allocated.
- The requirement count, split functional and non-functional.
- Every `[NEEDS CLARIFICATION]` marker, numbered, with what it blocks.
- Any constitution gate this spec cannot yet satisfy.

Then say: run `/sdd-speckit:speckit.clarify` if any marker is open, otherwise
`/sdd-speckit:speckit.plan`.
