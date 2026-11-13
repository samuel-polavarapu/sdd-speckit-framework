# Discovery report: [REPOSITORY NAME]

**Date:** [YYYY-MM-DD] · **Read at:** `[commit sha]` · **Scan:** `.specify/discovery/inventory.json`

This report describes the codebase as it is. It records what was observed, where, and how sure
the observation is. It makes no recommendation; the adoption roadmap does that.

**Confidence scale:** **high** — read in the code or the config; **medium** — inferred from
several files; **low** — inferred from names or one example.

## Summary

[Five sentences at most. What the system does, how it is built, and its state of health.]

## Technology

| Area | Observed | Evidence | Confidence |
|---|---|---|---|
| Languages and versions | [e.g. TypeScript 5.4] | [`package.json`] | [high] |
| Frameworks | [Observed.] | [Path.] | [Level.] |
| Storage | [Observed.] | [Path.] | [Level.] |
| Messaging and integration | [Observed.] | [Path.] | [Level.] |
| Build and package management | [Observed.] | [Path.] | [Level.] |
| Runtime and deployment | [Observed.] | [Path.] | [Level.] |

## Architecture

[One paragraph: the architectural style, and how a request or a job flows through the system.]

| Component | Path | Responsibility | Depends on |
|---|---|---|---|
| [Name.] | [`path/`] | [One responsibility.] | [Components, external systems.] |

**Boundaries that hold:** [Where the layering is respected.]
**Boundaries that leak:** [Where it is not, with one example path each.]

## External interfaces

| Interface | Kind | Direction | Defined in | Consumers or providers |
|---|---|---|---|---|
| [Name.] | [REST / event / file / database] | [in / out] | [Path, or "not documented".] | [Who.] |

## Data

| Store | Entities | Owner | Migrations | Sensitive data |
|---|---|---|---|---|
| [Store.] | [Main entities.] | [Component.] | [Tool, or "by hand".] | [Kind, or "none found".] |
<!-- slot:data-rows -->

## Conventions in use

Only conventions that the code follows consistently. A convention followed in half the code goes
under Inconsistencies.

| Area | Convention | Example |
|---|---|---|
| Naming | [Observed rule.] | [`path`] |
| Structure | [Observed rule.] | [`path`] |
| Error handling | [Observed rule.] | [`path`] |
| Logging | [Observed rule.] | [`path`] |
| Configuration and secrets | [Observed rule.] | [`path`] |

**Inconsistencies:** [Two or more competing patterns for the same thing, with a path for each.]

## Test and quality state

| Measure | Observed | Evidence |
|---|---|---|
| Test layers present | [unit / integration / contract / end to end] | [Paths.] |
| Test files to source files | [ratio] | [Scan.] |
| Coverage | [Number, or "not measured".] | [Report path.] |
| Tests run in CI | [yes / no / some] | [Workflow path.] |
| Lint and format enforced | [yes / no] | [Config and workflow path.] |
| Type checking | [strict / partial / none] | [Config path.] |

## Delivery

| Area | Observed | Evidence |
|---|---|---|
| Branching and review | [Observed.] | [Branch protection, CODEOWNERS, PR template.] |
| CI stages | [Observed.] | [Workflow paths.] |
| Release and rollback | [Observed.] | [Path, or "not documented".] |
| Environments | [Observed.] | [Path.] |

## Feature areas

The unit for baseline specs. One row per area a user or another system would name.

| Area | Entry points | Main paths | Tests | Baseline spec priority |
|---|---|---|---|---|
| [Area.] | [Route, command, job, event.] | [`path/`] | [good / thin / none] | [high / medium / low] |

## Risks and hotspots

| # | Observation | Evidence | Why it matters |
|---|---|---|---|
| H1 | [e.g. the most changed file has no test.] | [`path`, change count.] | [Consequence.] |

<!-- slot:sections-before-unknowns -->
## Unknowns

What the code does not say. Each one is a question for a person.

| # | Question | Who can answer | Blocks |
|---|---|---|---|
| U1 | [NEEDS CLARIFICATION: question] | [Role.] | [Constitution / baseline spec / gate.] |
