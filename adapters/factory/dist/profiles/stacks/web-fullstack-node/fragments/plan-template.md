<!-- @slot preamble -->
> Stack preset: **Web full-stack (Node + TypeScript)** (`web-fullstack-node`). Technical context and test strategy are
> pre-filled for this stack. Change a value only with a reason recorded in Key decisions.

<!-- @slot technical-context-rows replace -->
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

<!-- @slot test-strategy-rows replace -->
| Unit | Pure functions, hooks, validators | Vitest | [Coverage threshold] |
| Integration | API route against a real Postgres in Docker | Vitest + Testcontainers | All routes in `contracts/` |
| Contract | Request and response shapes against the OpenAPI document | Vitest + a schema validator | Every endpoint |
| End to end | Critical user journeys in a real browser | Playwright | Every acceptance scenario in `spec.md` |
| Accessibility | Rendered pages | `@axe-core/playwright` | No serious or critical violation |

<!-- @slot sections-before-open-questions -->
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
