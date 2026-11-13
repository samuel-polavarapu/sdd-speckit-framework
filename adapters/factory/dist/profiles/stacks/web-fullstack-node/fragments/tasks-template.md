<!-- @slot preamble -->
> Stack preset: **Web full-stack (Node + TypeScript)** (`web-fullstack-node`). See the stack-specific task block below.

<!-- @slot sections-after-phases -->
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
