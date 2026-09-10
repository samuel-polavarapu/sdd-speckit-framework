# Implementation plan: [FEATURE NAME]

> Stack preset: **.NET distributed app (Aspire)** (`dotnet-aspire`). Technical context and test strategy are
> pre-filled for this stack. Change a value only with a reason recorded in Key decisions.

**Spec:** `./spec.md` · **Branch:** `[NNN]-[feature-slug]`
**Created:** [YYYY-MM-DD] · **Status:** Draft

## Summary

[Two or three sentences. What is being built, and the shape of the approach.]

## Technical context

| Field | Value |
|---|---|
| Language and version | C# 13 on .NET 9 |
| Runtime | ASP.NET Core, orchestrated by .NET Aspire |
| Primary framework | .NET Aspire AppHost + Minimal APIs |
| Storage | [SQL Server or PostgreSQL] via EF Core 9 |
| Testing | xUnit (unit), Testcontainers (integration), Aspire.Hosting.Testing (distributed) |
| Target platform | Linux container, Azure Container Apps or Kubernetes |
| Project type | service |
| Performance goal | [From NFR — state a p95 latency and a throughput target] |
| Constraints | [Hard limits: budget, latency, compliance] |
| Scale | [Requests per second, data volume] |
| Package manager | NuGet with central package management in `Directory.Packages.props` |

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
| Unit | Domain logic, validators, mappers | xUnit + FluentAssertions | [Coverage threshold] |
| Integration | Endpoint against a real database container | Testcontainers | All endpoints in `contracts/` |
| Distributed | The whole AppHost graph, service to service | `Aspire.Hosting.Testing` | Every service dependency resolves |
| Contract | Generated OpenAPI document | `Microsoft.AspNetCore.OpenApi` + a schema diff | No breaking change |
| Architecture | Project reference rules | NetArchTest | No layering violation |

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | [Risk.] | [L/M/H] | [L/M/H] | [Action, and its owner.] |

## Rollout and rollback

- **Rollout:** [Flag, staged release, or direct.]
- **Rollback:** [The exact revert path.]
- **Monitoring:** [Signal that says this is working, and the alert threshold.]

## Stack conventions — .NET Aspire

- **The AppHost owns the topology.** Every resource — database, cache, queue, project — is declared
  in the AppHost, and consumers receive it by reference. Never hard-code a connection string in a
  service.
- **Service defaults go in the shared `ServiceDefaults` project**: health checks, OpenTelemetry,
  service discovery, resilience handlers. Do not re-add them per service.
- **EF Core migrations run from a dedicated migration service or an explicit step**, never
  automatically on service start. An automatic migration on start makes a rollback unsafe.
- **Central package management.** Versions live in `Directory.Packages.props`, not in each
  `.csproj`.
- **Nullable reference types and warnings-as-errors stay on.** Do not suppress them per file.

## Resources declared in the AppHost

| Resource | Kind | Consumed by |
|---|---|---|
| [name] | [postgres / redis / project / queue] | [services] |

## Open questions

| # | Question | Blocks | Owner |
|---|---|---|---|
| Q1 | [NEEDS CLARIFICATION: question] | [Which decision.] | [Role.] |

## Artifacts produced

- [ ] `research.md`
- [ ] `data-model.md`
- [ ] `contracts/`
- [ ] `quickstart.md`
