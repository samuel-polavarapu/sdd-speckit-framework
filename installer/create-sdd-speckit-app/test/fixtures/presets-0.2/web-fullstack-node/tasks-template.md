# Tasks: [FEATURE NAME]

> Stack preset: **Web full-stack (Node + TypeScript)** (`web-fullstack-node`). See the stack-specific task block below.

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

## Stack-specific tasks — Node full-stack

Add these where the feature touches the relevant layer. They are easy to forget and expensive to
retrofit.

| ID | Task | File | When needed |
|---|---|---|---|
| S001 | Add the Zod or TypeBox request schema for each new route. | `src/api/schemas/[name].ts` | Any new endpoint |
| S002 | Add the Prisma migration and check it in. | `prisma/migrations/` | Any data-model change |
| S003 | Regenerate the client types from the API schema. | `src/client/generated/` | Any contract change |
| S004 | Add the Playwright journey for the acceptance scenario. | `e2e/[feature].spec.ts` | Any user-facing change |
| S005 | Add the axe accessibility assertion to the new page. | `e2e/[feature].spec.ts` | Any new page |

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
