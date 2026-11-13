## Spec-driven development

This repository follows spec-driven development with the sdd-speckit framework. A feature moves
through phases. Each phase reads what the phase before it wrote, and writes one artifact.

```
onboard → constitution → specify → clarify → plan → checklist → tasks → analyze → implement → converge
```

| Phase | Writes | Rule |
|---|---|---|
| constitution | `.specify/memory/constitution.md` | The only phase that may change that file. |
| specify | `specs/NNN-slug/spec.md` | What and why. No technology. |
| clarify | resolved markers in `spec.md` | Ask; do not guess. |
| plan | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `architecture.md`, `deployment.md` | How. Each choice names the option it rejected. |
| checklist | `checklists/<kind>.md` | A **no** blocks the phase the checklist gates. |
| tasks | `tasks.md` | A test task comes before the task it covers. |
| analyze | a report, no file | Read-only. |
| implement | source code, ticked tasks, `implementation-log.md`, generated `coverage-report.md` | Follow `tasks.md` order. |
| converge | appended tasks, a report | Compare the spec with what shipped. |

Run a phase by name. Claude Code: `/sdd-speckit:speckit.<phase>`. GitHub Copilot:
`/sdd-speckit-<phase>`.

### Where things are

| Path | Holds |
|---|---|
| `.specify/memory/constitution.md` | The rules every artifact is checked against. Read it first. |
| `specs/NNN-slug/` | One feature: spec, plan, tasks and their companions. |
| `specs/_baseline/` | As-built descriptions of code that existed before this workflow. Not feature specs. |
| `.specify/templates/overrides/` | The templates composed for this project. They win over the framework's base templates. |
| `.specify/sdd-speckit.json` | The project's choices: mode, industry, stack, gates. |
| `docs/adr/` | Architecture decision records. |

### Rules for every agent

- Read the constitution and the active feature's `spec.md`, `plan.md` and `tasks.md` before you change code.
- Do not write source code for a feature that has no spec, plan and tasks. Start the missing phase.
- Write the failing test first. Then write the code that makes it pass.
- Never edit `.specify/memory/constitution.md` outside the constitution phase.
- Mark an unknown as `[NEEDS CLARIFICATION: question]`. Do not fill a gap with a guess.
- When the plan and the code disagree, stop and say so. Record the deviation in `implementation-log.md`.
- Match the conventions already in the code. Do not bring in a new style.
- Never put a secret, a credential or real personal data in a file, a test, a log or a prompt.
<!-- slot:rules-items -->

<!-- slot:technology -->
### Build, test and lint

<!-- slot:commands:begin -->
| Action | Command |
|---|---|
| Install | [NEEDS CLARIFICATION: install command] |
| Test | [NEEDS CLARIFICATION: test command] |
| Lint | [NEEDS CLARIFICATION: lint command] |
| Format check | [NEEDS CLARIFICATION: format command] |
<!-- slot:commands:end -->

Run the tests before you report a task as done. Report the real result.

<!-- slot:conventions -->
### Harness gates

Deterministic checks run on every file write (assistant hooks) and on every pull request (CI).
Each gate is `off`, `warn` or `block` in `.specify/sdd-speckit.json`.

| Gate | Checks |
|---|---|
| `constitution-guard` | The constitution changes only in its own phase. |
| `spec-before-code` | Source changes only when the active feature has `spec.md` and `plan.md`. |
| `tasks-before-implement` | Source changes only when the active feature has `tasks.md`. |
| `test-first` | A source change comes with a test change. |
| `secrets-scan` | No credential or sensitive value is written. |
| `lint-format` | The lint and format commands pass. |
| `destructive-commands` | The assistant runs no force push, hard reset, protected delete, SQL drop or infrastructure apply. |
| `human-approval` | The plan, the tasks and the code each start after a person approved the artifact before them. |

- See the current modes and the active feature: `python3 .specify/sdd-speckit/scripts/harness/gate.py status`
- A blocked write is a signal to run the missing phase. Do not work around a gate, and do not
  write through the shell to avoid one.
- **An approval is a person's decision.** Never run `gate.py approve`, and never write under
  `specs/<feature>/approvals/`. Show the person the command and wait.
- The active feature is the one named in `.specify/.active-spec`, or the `NNN-slug` branch.

<!-- slot:sections-end -->
