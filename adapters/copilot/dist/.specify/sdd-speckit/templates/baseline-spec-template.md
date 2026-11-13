# Baseline specification: [FEATURE AREA]

**Kind:** as-built · **Created:** [YYYY-MM-DD] · **Read at:** `[commit sha]`
**Source:** `.specify/discovery/report.md`, feature area "[AREA]"

## Rules for this document

- Record what the code **does**. Do not record what it should do.
- Every statement cites evidence: a path, a test name or a route. No evidence, no statement.
- Mark confidence on every requirement: **high** — a test proves it; **medium** — read in the
  code; **low** — inferred.
- Suspected defects go in Known gaps. Do not rewrite them as requirements.
- This is not a feature spec. It does not satisfy the spec-before-code gate. A change to this area
  starts with a new spec that names this baseline as its starting point.
<!-- slot:guardrails-items -->

## What the area does

[One paragraph, in the user's terms.]

## Observed scenarios

1. **Given** [state], **when** [action], **then** [observed result]. — Evidence: [`path` or test]
2. **Given** [state], **when** [action], **then** [observed result]. — Evidence: [`path` or test]

## Observed behaviour

### Functional

| ID | The system does | Evidence | Confidence | Covered by a test |
|---|---|---|---|---|
| BR-001 | [Behaviour, stated as a fact.] | [`path:line`] | [high / medium / low] | [Test name, or "no".] |
| BR-002 | [Behaviour.] | [`path:line`] | [Level.] | [Test name, or "no".] |

### Non-functional

| ID | Property | Observed value | Evidence | Confidence |
|---|---|---|---|---|
| BN-001 | [Performance, limits, retention, availability.] | [Value, or "not measured".] | [Path, dashboard, config.] | [Level.] |
<!-- slot:nfr-rows -->

### Entities

| Entity | Meaning | Stored in | Owner |
|---|---|---|---|
| [Name.] | [What it represents.] | [Store.] | [Component.] |

## Interfaces

| Interface | Kind | Contract | Consumers |
|---|---|---|---|
| [Name.] | [REST / event / CLI] | [Path to the definition, or "none".] | [Who.] |

<!-- slot:sections-before-known-gaps -->
## Known gaps

| # | Gap | Kind | Evidence |
|---|---|---|---|
| K1 | [What is missing, untested or inconsistent.] | [no test / suspected defect / undocumented / dead code] | [`path`] |

## Open questions

| # | Question | Who can answer |
|---|---|---|
| Q1 | [NEEDS CLARIFICATION: is this behaviour intended?] | [Role.] |
