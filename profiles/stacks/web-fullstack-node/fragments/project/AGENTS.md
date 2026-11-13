<!-- @slot commands replace -->
| Action | Command |
|---|---|
| Install | `npm ci` |
| Test | `npm test` |
| Lint | `npx eslint .` |
| Format check | `npx prettier --check .` |
| Type check | `npx tsc --noEmit` |
| End-to-end tests | `npx playwright test` |

<!-- @slot conventions -->
### Stack conventions — Node full-stack

- TypeScript runs in `strict` mode. Do not add `any` or `@ts-ignore` without a comment that gives the reason.
- Validate every request at the API boundary with the route's schema. Share the types with the client; do not write them twice.
- Change the database only through a Prisma migration that is checked in. Never edit a migration that has shipped.
- Generated client types are build output. Regenerate them; do not edit them by hand.
- A new page needs an accessibility assertion in its Playwright journey.
