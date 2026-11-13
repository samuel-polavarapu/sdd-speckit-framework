# ADR-0000: Record architecture decisions

**Status:** Accepted
**Date:** [YYYY-MM-DD] · **Deciders:** [Names or roles]
**Feature:** project-wide

## Context

A plan records its key decisions, but a plan belongs to one feature. A decision that outlives the
feature, or that binds several features, has no durable home. People and coding agents then
re-open a settled question, or reverse a decision without knowing why it was made.

## Decision

We record each decision that outlives a feature as an architecture decision record in
`docs/adr/`, named `NNNN-short-title.md`, written from the framework's ADR template.

- The plan phase writes an ADR when a key decision in `plan.md` affects more than the feature.
- An ADR is not edited after it is accepted. A new ADR supersedes it, and each links to the other.
- An agent reads the ADRs that touch the area it changes, and does not contradict an accepted one.

## Alternatives considered

| Option | For | Against | Why not chosen |
|---|---|---|---|
| Keep decisions only in each `plan.md` | No extra file. | Hard to find; lost when the feature closes. | Decisions outlive features. |
| A wiki | Easy to edit. | Not versioned with the code; agents do not read it. | The record must travel with the repository. |

## Consequences

- **Easier:** A newcomer, human or agent, finds the reason behind the structure of the code.
- **Harder:** A plan author must judge which decisions are project-wide.
- **Reversal cost:** Low. The records stay useful even if the practice stops.

## Compliance

- **Constitution:** Supports the governance article: decisions are recorded and reviewable.
- **Verified by:** Review. The plan template's "Artifacts produced" list names the ADR.
