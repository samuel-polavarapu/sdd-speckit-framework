# Implementation plan: [FEATURE NAME]

**Spec:** `./spec.md` · **Branch:** `[NNN]-[feature-slug]`
**Created:** [YYYY-MM-DD] · **Status:** Draft

## Summary

[Two or three sentences. What is being built, and the shape of the approach.]

## Technical context

| Field | Value |
|---|---|
| Language and version | [e.g. TypeScript 5.6 / Python 3.12 / C# 12] |
| Primary framework | [NEEDS CLARIFICATION if not decided] |
| Storage | [Database or "none"] |
| Testing | [Test runner and layers] |
| Target platform | [Where it runs] |
| Project type | [single / web / mobile / library / service] |
| Performance goal | [From NFR, restated as an engineering target] |
| Constraints | [Hard limits: budget, latency, compliance] |
| Scale | [Users, requests, data volume] |

## Constitution check

Run before design, and again after. A failed gate blocks `/speckit.tasks`.

| Gate | Status | Note |
|---|---|---|
| N1 Test-first | [PASS / FAIL / N/A] | [How this plan satisfies it.] |
| N2 Spec before code | [PASS / FAIL] | [Link to spec.] |
| N3 Agent output reviewed | [PASS / FAIL] | [Named reviewer.] |
| N4 Clarify before build | [PASS / FAIL] | [Open marker count.] |

**Violations and justification:** [None, or: gate, reason, simpler alternative rejected and why.]

## Architecture

### Component view

[Text description or diagram. Name each component and its single responsibility.]

| Component | Responsibility | Depends on |
|---|---|---|
| [Name] | [One responsibility.] | [Other components.] |

### Key decisions

| # | Decision | Alternatives considered | Why this one |
|---|---|---|---|
| D1 | [Decision.] | [A, B.] | [Trade-off accepted.] |
| D2 | [Decision.] | [A, B.] | [Trade-off accepted.] |

Record anything that needed investigation in `./research.md`.

### Data model

Full detail in `./data-model.md`. Summary:

- [Entity] → [store, lifecycle, ownership]

### Contracts

Full detail in `./contracts/`. Summary:

| Contract | Kind | Consumer | File |
|---|---|---|---|
| [Name] | [REST / GraphQL / event / CLI] | [Who calls it.] | `contracts/[file]` |

## Project structure

```
[Directory tree this feature adds or changes. Only the parts that change.]
```

## Phased delivery

| Phase | Outcome | Exit criterion |
|---|---|---|
| P1 | [Thin vertical slice.] | [Observable behaviour, and its test.] |
| P2 | [Next slice.] | [Observable behaviour, and its test.] |
| P3 | [Hardening.] | [Budget met, gates green.] |

## Test strategy

| Layer | Scope | Tool | Gate |
|---|---|---|---|
| Unit | [What.] | [Tool.] | [Threshold.] |
| Integration | [What.] | [Tool.] | [Threshold.] |
| Contract | [What.] | [Tool.] | [Threshold.] |
| End to end | [Critical paths.] | [Tool.] | [Threshold.] |

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | [Risk.] | [L/M/H] | [L/M/H] | [Action, and its owner.] |

## Rollout and rollback

- **Rollout:** [Flag, staged release, or direct.]
- **Rollback:** [The exact revert path.]
- **Monitoring:** [Signal that says this is working, and the alert threshold.]

## Open questions

| # | Question | Blocks | Owner |
|---|---|---|---|
| Q1 | [NEEDS CLARIFICATION: question] | [Which decision.] | [Role.] |

## Artifacts produced

- [ ] `research.md`
- [ ] `data-model.md`
- [ ] `contracts/`
- [ ] `quickstart.md`
