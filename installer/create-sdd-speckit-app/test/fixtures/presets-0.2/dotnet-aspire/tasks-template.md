# Tasks: [FEATURE NAME]

> Stack preset: **.NET distributed app (Aspire)** (`dotnet-aspire`). See the stack-specific task block below.

**Plan:** `./plan.md` · **Spec:** `./spec.md`
**Created:** [YYYY-MM-DD] · **Total tasks:** [N]

## Conventions

- `[P]` marks a task that can run in parallel with its siblings. Tasks that touch the same file
  are never both marked `[P]`.
- Every task states the exact file path it changes.
- A test task always precedes the implementation task it covers. This is constitution gate N1.
- Task ids are stable. Do not renumber; append instead.

## Phase 1 — Setup

| ID | Task | File | Depends on | Parallel |
|---|---|---|---|---|
| T001 | [Create project scaffold.] | `[path]` | — | |
| T002 | [Add dependencies.] | `[path]` | T001 | |
| T003 | [Configure linter and formatter.] | `[path]` | T001 | `[P]` |

## Phase 2 — Tests first

These tests must exist and **must fail** before Phase 3 starts.

| ID | Task | File | Covers | Parallel |
|---|---|---|---|---|
| T004 | [Contract test for [endpoint].] | `[path]` | FR-001 | `[P]` |
| T005 | [Integration test for [scenario].] | `[path]` | Acceptance 1 | `[P]` |
| T006 | [Unit test for [rule].] | `[path]` | V1 | `[P]` |

## Phase 3 — Implementation

| ID | Task | File | Depends on | Parallel |
|---|---|---|---|---|
| T007 | [Implement [entity] model.] | `[path]` | T006 | |
| T008 | [Implement [service].] | `[path]` | T007 | |
| T009 | [Implement [endpoint].] | `[path]` | T008, T004 | |

## Phase 4 — Integration

| ID | Task | File | Depends on | Parallel |
|---|---|---|---|---|
| T010 | [Wire storage.] | `[path]` | T007 | |
| T011 | [Add logging and metrics.] | `[path]` | T009 | `[P]` |
| T012 | [Add error handling.] | `[path]` | T009 | |

## Phase 5 — Polish

| ID | Task | File | Depends on | Parallel |
|---|---|---|---|---|
| T013 | [Write `quickstart.md`.] | `quickstart.md` | T009 | `[P]` |
| T014 | [Performance check against NFR-001.] | `[path]` | T012 | |
| T015 | [Remove duplication found in review.] | `[path]` | T012 | |

## Stack-specific tasks — .NET Aspire

| ID | Task | File | When needed |
|---|---|---|---|
| S001 | Declare the new resource in the AppHost and wire the reference. | `src/AppHost/Program.cs` | Any new dependency |
| S002 | Add the EF Core migration. | `src/[Project]/Migrations/` | Any data-model change |
| S003 | Add the health check for the new dependency. | `src/ServiceDefaults/Extensions.cs` | Any new dependency |
| S004 | Add the `Aspire.Hosting.Testing` test that the graph starts. | `tests/[Project].Tests/AppHostTests.cs` | Any topology change |
| S005 | Add the endpoint to the OpenAPI document and diff it for breaking changes. | `src/[Project]/Api/` | Any contract change |

## Requirement coverage

Every requirement in `spec.md` needs at least one task. An empty cell is a gap.

| Requirement | Tasks |
|---|---|
| FR-001 | T004, T009 |
| FR-002 | [tasks] |
| NFR-001 | T014 |

## Parallel execution example

```
# After T003 completes, these are independent:
T004  T005  T006
```

## Definition of done

- [ ] Every task is checked off
- [ ] Every test passes
- [ ] Requirement coverage table has no empty cell
- [ ] `/speckit.analyze` reports no inconsistency
- [ ] Constitution gates are green
