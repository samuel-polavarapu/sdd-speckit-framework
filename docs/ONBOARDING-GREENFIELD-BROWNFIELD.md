# Onboarding a project: greenfield and brownfield

How to bring a repository under spec-driven development. There are two routes. A **greenfield**
project has no code yet, so the rules apply from the first commit. A **brownfield** project has
code already, so the framework first records what exists, and then tightens the rules in steps.

Related: [HARNESS.md](HARNESS.md) · [TEMPLATES.md](TEMPLATES.md) ·
[INDUSTRY_PROFILES.md](INDUSTRY_PROFILES.md) · [INSTALLER.md](INSTALLER.md) · [../ONBOARDING.md](../ONBOARDING.md)

Command names below are the Claude Code form, `/sdd-speckit:speckit.<phase>`. In GitHub Copilot
the same phase is `/sdd-speckit-<phase>`, for example `/sdd-speckit-onboard`.

## The two routes at a glance

| | Greenfield | Brownfield |
|---|---|---|
| Starting point | An empty or new repository | A repository with code |
| Gate defaults | Every gate at `block` | `warn`, except `constitution-guard` and `secrets-scan` at `block` |
| Constitution | Written from intent | Derived from what the code does; each rule marked observed or aspirational |
| First artifacts | Constitution, then the first feature spec | Discovery report, constitution, baseline specs, adoption roadmap |
| Existing files | None | Merged or kept. Never replaced. |

```
Greenfield:  install → onboard → constitution → specify → clarify → plan → checklist → tasks → implement → converge
Brownfield:  install → onboard → discover → constitution → baseline → (the same feature phases for new work)
```

## Step 1 — Install

Both installers ask the same eight questions and write the same files:
telemetry, project mode, industry, tech stack, primary assistant, MCP connectors, code editor,
harness gates. Every answer is also a flag. See [INSTALLER.md](INSTALLER.md).

### Greenfield

```bash
# Node 18 or newer
npx create-sdd-speckit-app my-app --yes --mode=greenfield --industry=none --stack=python-fastapi --assistant=claude

# No Node: bash, python3 and curl
./installer/install.sh my-app --yes --mode=greenfield --industry=none --stack=python-fastapi --assistant=claude
```

### Brownfield

Run it inside the existing repository, on a branch:

```bash
git checkout -b adopt-sdd

npx create-sdd-speckit-app . --dry-run --yes --mode=brownfield --industry=healthcare --stack=auto   # preview
npx create-sdd-speckit-app . --yes --mode=brownfield --industry=healthcare --stack=auto

# or
./installer/install.sh . --yes --mode=brownfield --industry=healthcare --stack=auto
```

| Flag | Values | Note |
|---|---|---|
| `--mode=` | `greenfield` \| `brownfield` \| `auto` | `auto` is the default with no earlier record. It scans the directory: source files or a manifest mean brownfield. |
| `--industry=` | `none` \| `general-saas` \| `healthcare` \| `financial-services` \| `public-sector` | Never detected. You choose it. |
| `--stack=` | `custom` \| `auto` \| `web-fullstack-node` \| `python-fastapi` \| `dotnet-aspire` | `auto` takes the stack the scan finds in the manifests, or `custom`. |
| `--gates=` | `default` \| `off` \| `warn` \| `block` | All gates at once |
| `--gate=<id>=<mode>` | repeatable | One gate |
| `--dry-run` | — | Prints every action. Writes nothing. |

### What the install writes

| Path | Content | If it exists |
|---|---|---|
| `.specify/sdd-speckit.json` | The eight answers and the `harness` block | Merged. Tuned globs and commands are kept. |
| `.specify/sdd-speckit/` | The pinned templates, profiles, composer and gate runner | Refreshed |
| `.specify/templates/overrides/` | Each phase template that a profile overlays, and the industry's own checklists | Replaced when still composed; kept when someone took it over |
| `AGENTS.md`, `CLAUDE.md` | Agent instructions, inside a marked block | Your text is kept. Only the marked block is replaced. |
| `.github/workflows/sdd-gates.yml` | The CI gates | Replaced when still composed |
| `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/` | Pull request and issue templates | Replaced when still composed |
| `.github/CODEOWNERS`, `docs/adr/0000-record-architecture-decisions.md` | Placeholder owners; the first ADR | Kept |
| `.claude/settings.json` | Telemetry env, permission rules, gate hooks (Claude Code target) | Merged. Nothing is removed. |
| `.github/skills/`, `.github/agents/`, `.github/hooks/`, `.github/copilot-instructions.md` | The Copilot render (Copilot target) | See [COPILOT.md](COPILOT.md) |
| `.mcp.json`, `.vscode/` or `.idea/` | Connectors and editor files | Merged |
| `.gitignore` | Four local state paths | Lines added |

Commit all of it except the paths in `.gitignore`. CI needs `.specify/sdd-speckit/` and
`.specify/sdd-speckit.json`.

## Step 2 — Onboard

```
/sdd-speckit:speckit.onboard
```

The command runs the scan and the onboarding script, and then does what a script cannot:

1. **Settles mode, industry and stack.** An answer in the record is kept. It asks only for what
   is missing, and it never chooses an industry for you.
2. **Previews, then applies.** It shows the file list from
   `onboard-project.py --dry-run`. In a brownfield repository it waits for a yes.
3. **Fills the gaps.** It finds the real install, test, lint and format commands and writes
   them under `## Project notes` in `AGENTS.md`, outside the marked block. It corrects
   `harness.sourceGlobs` and `harness.testGlobs` when the repository's layout differs.
4. **Checks the harness.** It runs `gate.py status` and `compose-templates.py --check`, and
   reports the mode of each gate.

It writes no source code and it does not write the constitution. Then it names the next step for
the mode.

You can run the script directly, with no assistant:

```bash
python3 .specify/sdd-speckit/scripts/onboard-project.py --project . --dry-run
python3 .specify/sdd-speckit/scripts/onboard-project.py --project . --mode brownfield --industry healthcare
```

## Greenfield route

| # | Run | Writes | Note |
|---|---|---|---|
| 1 | `/sdd-speckit:speckit.constitution` | `.specify/memory/constitution.md` | Starts from the composed template: gates N1 to N5, the industry gates `G-<XX>-n` and `Annex R` are already there. Fill the placeholders. |
| 2 | `/sdd-speckit:speckit.specify <feature>` | `specs/001-<slug>/spec.md`, `checklists/requirements.md`, `.specify/.active-spec` | What and why. No technology. |
| 3 | `/sdd-speckit:speckit.clarify` | The spec, with markers resolved | Until no `[NEEDS CLARIFICATION]` is left |
| 4 | `/sdd-speckit:speckit.plan` | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` | The stack rows are pre-filled by the stack profile |
| 5 | `/sdd-speckit:speckit.checklist <kind>` | `checklists/<kind>.md` | A person answers it |
| 6 | `/sdd-speckit:speckit.tasks` | `tasks.md` | Includes the stack tasks `S###` and regulatory tasks `R###` |
| 7 | `/sdd-speckit:speckit.analyze` | A report only | Read-only |
| 8 | `/sdd-speckit:speckit.implement` | Source code, `implementation-log.md` | Tests first |
| 9 | `/sdd-speckit:speckit.converge` | `converge-report.md`, gap tasks | Spec against shipped code |

Because every gate is at `block`, a source write before step 6 is refused, and the message names
the phase that is missing. That is the intended path, not an error.

## Brownfield route

### 1. Discover

```
/sdd-speckit:speckit.discover
```

| Writes | Content |
|---|---|
| `.specify/discovery/inventory.json` | The scan: languages, manifests, layout, tests, CI, lint configs, most changed files. Deterministic. |
| `.specify/discovery/report.md` | Technology, architecture, interfaces, data, conventions, test and delivery state, feature areas, hotspots, unknowns |

The `codebase-cartographer` agent does the read. It has no write tools. Every row in the report
has evidence (a path) and a confidence: high, medium or low. The report records; it does not
recommend. It changes no source file.

**Before the next step, a person answers the Unknowns that block the constitution.**

### 2. Constitution, derived

```
/sdd-speckit:speckit.constitution
```

With a discovery report present, the phase derives instead of inventing:

- Each principle comes from a convention the report records at high or medium confidence, and
  cites the evidence.
- Each principle and gate is marked **(observed)** — the code already does it — or
  **(aspirational)** — it is not true yet.
- An aspirational gate is allowed. The roadmap plans when it starts to block.
- When a rule you want contradicts what the code does, the phase asks which one wins.
- Profile content stays: gates `G-<XX>-n`, the quality-bar items and `Annex R`.

### 3. Baseline

```
/sdd-speckit:speckit.baseline            # the areas the report ranks high
/sdd-speckit:speckit.baseline billing    # one area
```

| Writes | Content |
|---|---|
| `specs/_baseline/<area>/spec.md` | What the area **does** today, as fact. Each row has evidence and a confidence. Suspected defects go under Known gaps; they are not fixed and not turned into requirements. |
| `.specify/adoption-roadmap.md` | Where the project is against the constitution, the observed and aspirational rules, the gate ratchet, baseline coverage and an ordered backlog |

A baseline spec is not a feature spec. It lives outside the `NNN-slug` pattern, so it **never
satisfies the `spec-before-code` gate**. A change to the area starts with a new numbered spec
that names the baseline as its starting point.

The phase refuses to start without the discovery report and the constitution.

### 4. New work

From here, new work follows the greenfield route from step 2.

## Rules while gates are at warn

From the adoption roadmap template:

- New features follow the full phase sequence from the first day.
- A change to existing code needs a spec when it changes behaviour. A fix that restores the
  behaviour in a baseline spec does not.
- Touch a file, leave a test: a change to an untested area adds the test the baseline lacks.

At `warn`, a write goes through, and the finding is recorded in `.specify/harness-log.jsonl` and
shown as a warning in the pull request. Read the log to see how often each gate would have
blocked.

## The gate ratchet

The roadmap has one row per gate: its mode now, the next mode, an exit criterion a person can
check, an owner and a target date. One gate moves at a time.

| Gate | Start | Example exit criterion to move to `block` |
|---|---|---|
| `constitution-guard` | block | — |
| `secrets-scan` | block | — |
| `lint-format` | warn | The default branch is lint-clean, and the format command changes nothing |
| `test-first` | warn | The test command runs in CI, and the weekly warn count is below the agreed number |
| `spec-before-code` | warn | Three features shipped through the phases; every active area has a baseline spec |
| `tasks-before-implement` | warn | The same as `spec-before-code` |

To move a gate when its criterion is met:

```bash
# in a session
/sdd-speckit:speckit.setup gates

# or by flag
npx create-sdd-speckit-app . --yes --gate=lint-format=block
./installer/install.sh . --yes --gate=lint-format=block
python3 .specify/sdd-speckit/scripts/onboard-project.py --project . --gate lint-format=block
```

Then add a row to the ratchet log in `.specify/adoption-roadmap.md`: date, gate, from, to,
approver, evidence. Commit the record and the roadmap in one pull request. The baseline phase
does not change a gate mode; a person does.

## Run it again safely

Every step can run again. A second run with the same answers changes nothing.

| File kind | Policy | On a re-run |
|---|---|---|
| `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` | `merge-block` | Only the marked block is replaced |
| Composed overrides, the CI workflow, pull request and issue templates | `replace-if-composed` | Replaced while the composed header is there. Remove the header to take a file over; it is then kept. `--force` replaces it. |
| `.github/CODEOWNERS`, the first ADR | `skip` | Kept |
| `.specify/sdd-speckit.json` | merge | An answer you do not give again is kept. Tuned globs, commands and `secretsAllow` are kept. |
| `.claude/settings.json` | merge | Rules and hooks are added once. None is removed. |
| Discovery report, roadmap | refresh | Answers to Unknowns and the ratchet log are kept |

After a profile change, or a framework upgrade, compose again and commit:

```bash
python3 .specify/sdd-speckit/scripts/onboard-project.py --project .
python3 .specify/sdd-speckit/scripts/compose-templates.py --project . --check
```

## Upgrade a 0.2 project

A record written before 0.3.0 has no mode, no industry and no gate modes.

| Step | Command | Result |
|---|---|---|
| 1 | Run the installer again with no new flag: `npx create-sdd-speckit-app . --yes` | The record moves to version 3. Earlier answers are kept. **Only the constitution guard runs, as before.** Templates are composed from the recorded stack; the output for a stack alone equals the 0.2 preset templates. |
| 2 | Choose a mode when the team is ready: `--mode=brownfield` (or `greenfield`), or `--gates=default` | The gates take that mode's defaults |
| 3 | Optional: `--industry=<id>` | The industry layer is added to the templates |
| 4 | `/sdd-speckit:speckit.onboard` | Fills the project notes and checks the harness |

Changes to know about:

- `presets/` is now `profiles/stacks/`. The stack ids are the same, so `--stack=` values and
  recorded stacks still work.
- The installer asks eight questions, not five. A script that pipes answers by position must be
  updated. Flags are not affected.
- The first step after install is `/sdd-speckit:speckit.onboard`, not the constitution phase.

## Not yet verified

The scripts and both installers are covered by the test suite in
`installer/create-sdd-speckit-app/test/`. The onboard, discover and baseline commands have not
yet been run end to end in a live Claude Code or GitHub Copilot session. Review what each one
writes on its first run in your repository.
