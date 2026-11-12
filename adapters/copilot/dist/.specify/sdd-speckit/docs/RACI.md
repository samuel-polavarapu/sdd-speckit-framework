# RACI — Speckit phases and artifacts

**A** Accountable, signs off (exactly one per row) · **R** Responsible, does the work ·
**C** Consulted before it is final · **I** Informed afterwards.

Claude is never **A**. Accountability stays with a human — that is constitution gate N3.

| Phase / Artifact | Tech Lead | Product Owner | Architect | Engineer | QA | Claude (AI agent) |
|---|---|---|---|---|---|---|
| Constitution → `constitution.md` | **A** | C | R | I | I | R (drafts) |
| Specify → `spec.md` | C | **A/R** | C | C | C | R (drafts) |
| Specify → `checklists/requirements.md` | C | A | I | I | R | R (drafts) |
| Clarify → resolved markers | C | **A/R** | C | C | C | R (asks, records) |
| Plan → `plan.md` | **A** | I | R | C | I | R (drafts) |
| Plan → `research.md` | I | I | **A/R** | C | I | R (gathers, cites) |
| Plan → `data-model.md` | I | I | **A/R** | C | C | R (drafts) |
| Plan → `contracts/` | C | I | **A/R** | C | C | R (drafts) |
| Plan → `quickstart.md` | I | I | C | **A/R** | C | R (drafts) |
| Checklist → `checklists/<kind>.md` | C | C | C | C | **A/R** | R (drafts, never answers) |
| Tasks → `tasks.md` | **A** | I | C | R | I | R (drafts) |
| Analyze → consistency report | C | I | C | C | **A/R** | R (reports, read-only) |
| Implement → source code | I | I | C | **A/R** | C | R (executes) |
| Implement → code review | C | I | C | **A/R** | C | R (reviews, advisory) |
| Converge → gap tasks | **A** | C | C | R | R | R (assesses) |
| Constitution amendment | **A** | C | R | I | I | R (drafts) |
| Gate waiver | **A** | C | I | I | C | I |

## Reading a row

- **One A per row.** If two people think they sign off, nobody does.
- **A/R** means the same role both owns the outcome and does the work.
- **A gate waiver is the Tech Lead's alone**, in writing, with an expiry date, logged in
  constitution Article V.

## Customizing this

Copy this file to your project's `docs/RACI.md` and edit the role names. The `raci-lookup` skill
prefers the project copy over the framework default, and says which one it used.

## Related

[Model routing](MODEL_ROUTING.md) · [Architecture](ARCHITECTURE.md) ·
[Workflow reference](../skills/speckit-workflow/SKILL.md)
