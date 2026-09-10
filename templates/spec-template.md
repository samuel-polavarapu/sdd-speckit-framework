# Feature specification: [FEATURE NAME]

**Feature branch:** `[NNN]-[feature-slug]`
**Created:** [YYYY-MM-DD] · **Status:** Draft · **Spec id:** [NNN]
**Input:** [The original request, quoted.]

## Execution guardrails

- Describe **what** the user needs and **why**. Do not describe **how** to build it.
- No tech stack, no API shapes, no schema, no library names. Those belong in `plan.md`.
- Mark every unknown as `[NEEDS CLARIFICATION: the specific question]`. Do not guess.
- Every requirement must be testable by someone who cannot read the code.

## User scenarios

### Primary user story

As a [role], I want [capability], so that [outcome].

### Acceptance scenarios

1. **Given** [initial state], **when** [action], **then** [observable result].
2. **Given** [initial state], **when** [action], **then** [observable result].
3. **Given** [initial state], **when** [action], **then** [observable result].

### Edge cases

- [Condition] → [expected behaviour]
- [Condition] → [expected behaviour]
- [NEEDS CLARIFICATION: what happens when …?]

## Requirements

### Functional

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-001 | The system MUST [capability]. | Must | [How it is verified.] |
| FR-002 | The system MUST [capability]. | Must | [How it is verified.] |
| FR-003 | The system SHOULD [capability]. | Should | [How it is verified.] |

### Non-functional

| ID | Requirement | Target | Measured where |
|---|---|---|---|
| NFR-001 | [Performance, availability, or scale statement.] | [Number and unit.] | [Where.] |
| NFR-002 | [Security or privacy statement.] | [Standard.] | [Where.] |
| NFR-003 | [Accessibility statement.] | [Level.] | [Where.] |

### Key entities

| Entity | Meaning | Key attributes | Relationships |
|---|---|---|---|
| [Name] | [What it represents in the domain.] | [Attributes, no types.] | [Links to other entities.] |

## Out of scope

- [Explicitly excluded item, and why.]
- [Explicitly excluded item, and why.]

## Dependencies and assumptions

- **Depends on:** [System, team, or decision.]
- **Assumes:** [Assumption. State it so a reviewer can reject it.]

## Success criteria

| Metric | Baseline | Target | How measured |
|---|---|---|---|
| [Business or user metric.] | [Now.] | [After.] | [Instrument.] |

## Open questions

| # | Question | Blocks | Owner | Resolution |
|---|---|---|---|---|
| Q1 | [NEEDS CLARIFICATION: question] | [Which requirement.] | [Role.] | [Empty until answered.] |

## Review checklist

- [ ] No implementation detail leaked into this document
- [ ] Every requirement is testable
- [ ] Every `[NEEDS CLARIFICATION]` marker is either resolved or listed in Open questions
- [ ] Success criteria are measurable
- [ ] Scope boundary is explicit
- [ ] Checked against the constitution non-negotiables
