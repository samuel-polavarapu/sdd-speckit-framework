# Implementation plan: [FEATURE NAME]

> Stack preset: **Python service (FastAPI)** (`python-fastapi`). Technical context and test strategy are
> pre-filled for this stack. Change a value only with a reason recorded in Key decisions.

**Spec:** `./spec.md` · **Branch:** `[NNN]-[feature-slug]`
**Created:** [YYYY-MM-DD] · **Status:** Draft

## Summary

[Two or three sentences. What is being built, and the shape of the approach.]

## Technical context

| Field | Value |
|---|---|
| Language and version | Python 3.12 |
| Runtime | uvicorn with uvloop |
| Primary framework | FastAPI |
| Storage | PostgreSQL 17 via SQLAlchemy 2.0, migrations by Alembic |
| Testing | pytest (unit, integration), schemathesis (contract) |
| Target platform | Linux container |
| Project type | service |
| Performance goal | [From NFR — state a p95 latency and a requests-per-second target] |
| Constraints | [Hard limits: budget, latency, compliance] |
| Scale | [Requests per second, data volume] |
| Package manager | uv with a locked `uv.lock` |

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
| Unit | Pure functions, Pydantic validators, domain rules | pytest | [Coverage threshold] |
| Integration | Route against a real Postgres in a container | pytest + Testcontainers | All routes in `contracts/` |
| Contract | Generated OpenAPI document, property-based | schemathesis | Every endpoint, no 500 |
| End to end | Critical flows against a running container | pytest + httpx | Every acceptance scenario in `spec.md` |
| Type | Whole package | `mypy --strict` | Zero error |

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | [Risk.] | [L/M/H] | [L/M/H] | [Action, and its owner.] |

## Rollout and rollback

- **Rollout:** [Flag, staged release, or direct.]
- **Rollback:** [The exact revert path.]
- **Monitoring:** [Signal that says this is working, and the alert threshold.]

## Stack conventions — FastAPI

- **Pydantic models are the contract.** FastAPI generates the OpenAPI document from them, so the
  schema and the code cannot diverge. Do not hand-write an OpenAPI file beside them.
- **Separate the request model from the ORM model.** Returning a SQLAlchemy row directly leaks
  columns you did not intend to expose.
- **Dependency injection through `Depends`,** so a test can override a dependency instead of
  monkey-patching a module.
- **`async def` only when the body actually awaits.** A blocking call inside an async route stalls
  the event loop, and the symptom looks like a capacity problem.
- **One Alembic revision per data-model change,** with a working `downgrade`.

## Container and runtime

| Field | Value |
|---|---|
| Base image | [NEEDS CLARIFICATION: distro and Python variant] |
| Worker model | [uvicorn workers, or a process manager] |
| Health endpoints | `/healthz` liveness, `/readyz` readiness |

## Open questions

| # | Question | Blocks | Owner |
|---|---|---|---|
| Q1 | [NEEDS CLARIFICATION: question] | [Which decision.] | [Role.] |

## Artifacts produced

- [ ] `research.md`
- [ ] `data-model.md`
- [ ] `contracts/`
- [ ] `quickstart.md`
