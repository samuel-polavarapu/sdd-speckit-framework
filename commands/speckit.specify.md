---
name: speckit.specify
description: Turn a feature request into a testable specification with no implementation detail. Conversational requirements work, so it runs on the balanced tier.
argument-hint: "<feature description in plain language>"
model: sonnet
---

# Phase 2 — Specify

You are writing **what** the user needs and **why**. You are not designing the solution.

## Templates

For every template this phase names, use `.specify/templates/overrides/<file>` when it exists,
otherwise `${CLAUDE_PLUGIN_ROOT}/templates/<file>`. An override is the base template composed
with the project's industry and stack profiles, so it wins. A line of the form
`<!-- slot:… -->` is a composition marker: never copy it into an artifact.

## Read first

1. `.specify/memory/constitution.md` — the gates this spec must satisfy.
2. `spec-template.md` — the required structure.
3. `specs/_baseline/` — in a brownfield project, the baseline spec of the area this feature
   changes. Name it in the spec as the starting point.
4. `specs/` — the highest existing `NNN` prefix, so you can allocate the next one.

## Do

Delegate to the **spec-author** subagent. Give it the feature description in `$ARGUMENTS` and the
constitution.

1. Allocate the next id: zero-padded three digits, `001` if `specs/` is empty.
2. Derive a slug from the feature name: lowercase, hyphenated, three words at most.
3. Fill every section of the template, including each section an industry profile added (a data
   inventory, a classification, a scope statement). Those sections are part of the spec. When
   one does not apply to this feature, say so in the section and give the reason.
4. Obey the guardrails. **No** tech stack, library name, API shape, or schema. If you catch
   yourself naming a framework, move that thought to a note for `/speckit.plan`.
5. Mark every unknown as `[NEEDS CLARIFICATION: the specific question]`. Guessing here is the
   most expensive mistake in the whole workflow. A spec with no clarification markers on a
   non-trivial feature is a spec that guessed.
6. Write acceptance scenarios in Given/When/Then form. Each must be checkable by someone who
   cannot read the code.
7. Generate `checklists/requirements.md` from
   `checklists/requirements-template.md`, plus one item per requirement, gating `/speckit.plan`.
8. Write the feature's directory name (`NNN-slug`) to `.specify/.active-spec`. The harness gates
   check every source write against that feature.

## Write to

- `specs/<NNN>-<slug>/spec.md`
- `specs/<NNN>-<slug>/checklists/requirements.md`
- `.specify/.active-spec`

## Report

- The path you created, and the id you allocated.
- The requirement count, split functional and non-functional.
- Every `[NEEDS CLARIFICATION]` marker, numbered, with what it blocks.
- Any constitution gate this spec cannot yet satisfy.

Then say: run `/sdd-speckit:speckit.clarify` if any marker is open, otherwise
`/sdd-speckit:speckit.plan`.
