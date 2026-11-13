# Implementation plan: [FEATURE NAME]

> Stack preset: **Web full-stack (Node + TypeScript)** (`web-fullstack-node`). Technical context and test strategy are
> pre-filled for this stack. Change a value only with a reason recorded in Key decisions.

**Spec:** `./spec.md` · **Branch:** `[NNN]-[feature-slug]`
**Created:** [YYYY-MM-DD] · **Status:** Draft

## Summary

[Two or three sentences. What is being built, and the shape of the approach.]

## Technical context

| Field | Value |
|---|---|
| Language and version | TypeScript 5.6 |
| Runtime | Node 22 LTS |
| Primary framework | React 19 + Vite (web), Fastify (API) |
| Storage | PostgreSQL 17 via Prisma |
| Testing | Vitest (unit, integration), Playwright (end to end) |
| Target platform | Browser + Node server |
| Project type | web |
| Performance goal | [From NFR — state a p95 latency and a bundle budget] |
| Constraints | [Hard limits: budget, latency, compliance] |
| Scale | [Users, requests, data volume] |
| Package manager | pnpm workspaces |

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
| Unit | Pure functions, hooks, validators | Vitest | [Coverage threshold] |
| Integration | API route against a real Postgres in Docker | Vitest + Testcontainers | All routes in `contracts/` |
| Contract | Request and response shapes against the OpenAPI document | Vitest + a schema validator | Every endpoint |
| End to end | Critical user journeys in a real browser | Playwright | Every acceptance scenario in `spec.md` |
| Accessibility | Rendered pages | `@axe-core/playwright` | No serious or critical violation |

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | [Risk.] | [L/M/H] | [L/M/H] | [Action, and its owner.] |

## Rollout and rollback

- **Rollout:** [Flag, staged release, or direct.]
- **Rollback:** [The exact revert path.]
- **Monitoring:** [Signal that says this is working, and the alert threshold.]

## Stack conventions — Node full-stack

- **Type safety across the boundary.** Derive the client's types from the API's schema. A
  hand-maintained duplicate type will drift, and nothing will catch it.
- **Validate at the edge.** Parse every request body with a schema (Zod or TypeBox) at the route
  handler. Do not trust a type assertion; a type is not a runtime check.
- **One Prisma migration per data-model change**, checked in with the code that needs it.
- **No barrel file that re-exports the whole feature.** It defeats tree-shaking and hides cycles.
- **Server and client code never share a module** that imports a Node built-in.

## Bundle budget

| Bundle | Budget | Measured by |
|---|---|---|
| Initial route | [NEEDS CLARIFICATION: kB gzipped] | `vite build --report` |

## Open questions

| # | Question | Blocks | Owner |
|---|---|---|---|
| Q1 | [NEEDS CLARIFICATION: question] | [Which decision.] | [Role.] |

## Artifacts produced

- [ ] `research.md`
- [ ] `data-model.md`
- [ ] `contracts/`
- [ ] `quickstart.md`
