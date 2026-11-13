# Templates

Every artifact a phase writes starts from a template. A template is composed from layers, so one
base serves every industry and every tech stack without copies that drift.

Related: [INDUSTRY_PROFILES.md](INDUSTRY_PROFILES.md) · [HARNESS.md](HARNESS.md) ·
[ONBOARDING-GREENFIELD-BROWNFIELD.md](ONBOARDING-GREENFIELD-BROWNFIELD.md) · [INSTALLER.md](INSTALLER.md)

Command names below are the Claude Code form, `/sdd-speckit:speckit.<phase>`. In GitHub Copilot
the same phase is `/sdd-speckit-<phase>`.

## Layers

| Order | Layer | Location | Holds |
|---|---|---|---|
| 1 | Base | `templates/` | The full template, with slot markers |
| 2 | Industry profile | `profiles/industries/<id>/fragments/` | Regulatory and domain content |
| 3 | Stack profile | `profiles/stacks/<id>/fragments/` | Technology content |
| 4 | Project-local | `<project>/.specify/templates/fragments/` | What only this project needs |

The composer, `scripts/compose-templates.py`, joins them in that order. It is the only thing that
joins them, and it uses the Python standard library only, so the result is the same on every
machine. Both installers, `/sdd-speckit:speckit.onboard`, `/sdd-speckit:speckit.setup` and CI run
the same script.

```
templates/                     base templates, plus manifest.json
templates/checklists/          one checklist base per kind
templates/project/             project artifacts: AGENTS.md, CI workflow, ...
profiles/industries/<id>/      profile.json, fragments/, templates/ (whole new files)
profiles/stacks/<id>/          profile.json, fragments/, vscode-extensions.json
```

## Slots and fragments

### Slots, in a base template

| Kind | Marker | A fragment may |
|---|---|---|
| Point slot | `<!-- slot:nfr-rows -->` | Append at that line |
| Block slot | `<!-- slot:commands:begin -->` … `<!-- slot:commands:end -->` | Replace the default content between the markers |

In a file that is not Markdown (YAML, `CODEOWNERS`) the marker is a comment: `# slot:stack-setup`.

A slot name is lowercase words joined by hyphens. Each name appears once in a file. The marker
line never reaches the output.

### Fragments, in a profile

A fragment has the same relative path as the base template it overlays. It holds only slot
blocks. Each block starts with a header line:

```markdown
<!-- @slot nfr-rows -->
| NFR-HC-01 | PHI is encrypted in transit and at rest. | [Standard.] | [Where.] |

<!-- @slot technical-context-rows replace -->
| Language and version | Python 3.12 |
| Primary framework | FastAPI |
```

In a non-Markdown fragment the header is `# @slot stack-setup`.

| Rule | Detail |
|---|---|
| Default mode | Append. Each layer's content follows the layer before it. |
| `replace` | Only for a block slot, and a block slot takes only `replace`. |
| One replace per slot | An industry and a stack may not both replace the same slot. The project-local layer may replace again; it wins. |
| Unknown slot | A hard error. The message lists the slots the base template has. |
| Text before the first header | An error. |
| Empty block | An error. |
| Tight slots | A slot named `…-rows` or `…-items` continues a table or a list: no blank line is added after the content. Any other slot gets one blank line after each block. |

### Rules for profiles

| Rule | Why |
|---|---|
| A stack may not overlay `spec-template.md`. | The spec stays free of technology. |
| A stack may not fill `principles` or `gates-rows` in the constitution. | Principles and gates are a governance choice, not a tool choice. |
| A fragment may not contain `CLAUDE_PLUGIN_ROOT`, or a slash command such as `/speckit.plan`. | A fragment must work for every assistant. Name the phase in words: "the plan phase". |
| A profile's whole-file template may not reuse the name of a base template. | It would shadow the base. |

`compose-templates.py --lint` checks all of these.

### Id namespaces

Appended ids never collide with base ids, because each layer has its own prefix. `XX` is the
industry code: `GS`, `HC`, `FS`, `PS`.

| Item | Base | Industry | Stack |
|---|---|---|---|
| Constitution gate | `N1`…`N5` | `G-XX-1`… | — |
| Constitution principle | `Principle 1`… | `Principle XX-1`… | — |
| Constitution annex | Articles I–VI | `Annex R — Regulatory controls` | `Annex T — Technology standards`, generated from the profile's `defaults` |
| Non-functional requirement | `NFR-001`… | `NFR-XX-01`… | — |
| Plan risk | `R1`… | `R-XX-1`… | — |
| Task | `T001`… | `R001`… | `S001`… |
| Checklist item | `C001`… | `C-XX-01`… | `C-ST-01`… |

## Slot inventory

Generated from `templates/`. A slot marked (block) takes `replace`; every other slot takes
appends.

### Phase templates

| Template | Slots |
|---|---|
| `constitution-template.md` | `principles`, `gates-rows`, `quality-bar-items`, `governance-items`, `annexes` |
| `spec-template.md` | `guardrails-items`, `edge-cases-items`, `nfr-rows`, `sections-after-requirements`, `review-checklist-items` |
| `plan-template.md` | `preamble`, `technical-context-rows` (block), `technical-context-extra-rows`, `constitution-check-rows`, `test-strategy-rows` (block), `test-strategy-extra-rows`, `risks-rows`, `rollout-items`, `sections-before-open-questions`, `artifacts-items` |
| `tasks-template.md` | `preamble`, `conventions-items`, `sections-after-phases`, `coverage-rows`, `definition-of-done-items` |
| `data-model-template.md` | `sections-before-open-questions` |
| `quickstart-template.md` | `sections-end` |
| `research-template.md` | none |
| `contract-template.md` | `sections-end` |
| `architecture-template.md` | `preamble`, `sections-after-components`, `verification-rows` |
| `deployment-template.md` | `preamble`, `unit-rows`, `configuration-rows`, `sections-end` |
| `adr-template.md` | `sections-end` |
| `implementation-log-template.md` | `log-rows`, `sections-end` |
| `analyze-report-template.md` | `gates-rows`, `sections-end` |
| `converge-report-template.md` | `gates-rows`, `sections-end` |
| `discovery-report-template.md` | `data-rows`, `sections-before-unknowns` |
| `baseline-spec-template.md` | `guardrails-items`, `nfr-rows`, `sections-before-known-gaps` |
| `adoption-roadmap-template.md` | `state-rows`, `backlog-rows`, `sections-before-log` |
| `checklist-template.md` | none |

### Checklist templates

| Template | Slots |
|---|---|
| `checklists/requirements-template.md` | `completeness-rows`, `clarity-rows`, `consistency-rows`, `sections-before-result` |
| `checklists/security-template.md` | `identity-rows`, `input-rows`, `data-rows`, `supply-chain-rows`, `sections-before-result` |
| `checklists/privacy-template.md` | `inventory-rows`, `minimisation-rows`, `rights-rows`, `sharing-rows`, `sections-before-result` |
| `checklists/accessibility-template.md` | `perceivable-rows`, `operable-rows`, `understandable-rows`, `robust-rows`, `sections-before-result` |
| `checklists/sast-template.md` | `input-rows`, `access-rows`, `data-rows`, `dependency-rows`, `sections-before-findings` |
| `checklists/release-template.md` | `evidence-rows`, `rollout-rows`, `operations-rows`, `signoff-rows`, `sections-before-result` |

### Project templates

| Template | Slots |
|---|---|
| `project/AGENTS.md` | `rules-items`, `technology`, `commands` (block), `conventions`, `sections-end` |
| `project/CLAUDE.md` | `rules-items`, `sections-end` |
| `project/sdd-gates.yml` | `stack-setup` |
| `project/pull_request_template.md` | `checklist-items`, `sections-end` |
| `project/ISSUE_TEMPLATE/feature.md` | `sections-end` |
| `project/ISSUE_TEMPLATE/bug.md` | `sections-end` |
| `project/CODEOWNERS` | `rules` |
| `project/adr-0000-record-decisions.md` | none |

## Template catalogue

### Phase artifacts

| Template | Written by | Artifact |
|---|---|---|
| `constitution-template.md` | `/sdd-speckit:speckit.constitution` | `.specify/memory/constitution.md` |
| `spec-template.md` | `/sdd-speckit:speckit.specify` | `specs/<NNN>-<slug>/spec.md` |
| `checklists/requirements-template.md` | `/sdd-speckit:speckit.specify` | `specs/<NNN>-<slug>/checklists/requirements.md` |
| `plan-template.md` | `/sdd-speckit:speckit.plan` | `specs/<NNN>-<slug>/plan.md` |
| `research-template.md` | `/sdd-speckit:speckit.plan` | `research.md` |
| `data-model-template.md` | `/sdd-speckit:speckit.plan` | `data-model.md` |
| `contract-template.md` | `/sdd-speckit:speckit.plan` | `contracts/<name>.md`, beside the machine-readable definition |
| `quickstart-template.md` | `/sdd-speckit:speckit.plan` | `quickstart.md` |
| `architecture-template.md` | `/sdd-speckit:speckit.plan` | `architecture.md`: C4 context, container and component views in Mermaid |
| `deployment-template.md` | `/sdd-speckit:speckit.plan` | `deployment.md`: deployment view, start-up order, configuration names |
| `adr-template.md` | `/sdd-speckit:speckit.plan` | `docs/adr/NNNN-<title>.md`, for a decision that outlives the feature |
| `checklists/<kind>-template.md` | `/sdd-speckit:speckit.checklist <kind>` | `specs/<NNN>-<slug>/checklists/<kind>.md` |
| `checklist-template.md` | `/sdd-speckit:speckit.checklist` | A kind that has no template of its own |
| `tasks-template.md` | `/sdd-speckit:speckit.tasks` | `tasks.md` |
| `analyze-report-template.md` | `/sdd-speckit:speckit.analyze` | A report in the conversation. Nothing is written. |
| `implementation-log-template.md` | `/sdd-speckit:speckit.implement` | `implementation-log.md` |
| `converge-report-template.md` | `/sdd-speckit:speckit.converge` | `converge-report.md` |

### Brownfield artifacts

| Template | Written by | Artifact |
|---|---|---|
| `discovery-report-template.md` | `/sdd-speckit:speckit.discover` | `.specify/discovery/report.md` |
| `baseline-spec-template.md` | `/sdd-speckit:speckit.baseline` | `specs/_baseline/<area>/spec.md` |
| `adoption-roadmap-template.md` | `/sdd-speckit:speckit.baseline` | `.specify/adoption-roadmap.md` |

### Project artifacts

Written by the composer itself, from `templates/manifest.json`.

| Template | Output | If the file exists | Condition |
|---|---|---|---|
| `project/AGENTS.md` | `AGENTS.md` | `merge-block` | — |
| `project/CLAUDE.md` | `CLAUDE.md` | `merge-block` | Claude Code target |
| `project/sdd-gates.yml` | `.github/workflows/sdd-gates.yml` | `replace-if-composed` | — |
| `project/pull_request_template.md` | `.github/pull_request_template.md` | `replace-if-composed` | — |
| `project/ISSUE_TEMPLATE/feature.md` | `.github/ISSUE_TEMPLATE/feature.md` | `replace-if-composed` | — |
| `project/ISSUE_TEMPLATE/bug.md` | `.github/ISSUE_TEMPLATE/bug.md` | `replace-if-composed` | — |
| `project/CODEOWNERS` | `.github/CODEOWNERS` | `skip` | — |
| `project/adr-0000-record-decisions.md` | `docs/adr/0000-record-architecture-decisions.md` | `skip` | — |

### Checklists that an industry profile adds

Whole files in `profiles/industries/<id>/templates/checklists/`: `soc2-change`,
`hipaa-safeguards`, `phi-handling`, `pci-scope`, `sox-change`, `ato-readiness`, `section-508`.
See [INDUSTRY_PROFILES.md](INDUSTRY_PROFILES.md).

## Where the output goes

| Kind | Output | When |
|---|---|---|
| Phase template | `.specify/templates/overrides/<same path>` | Only when a fragment touched it. An untouched base template is not copied, so a framework upgrade still reaches it. |
| A profile's whole-file template | `.specify/templates/overrides/<same path>` | Always, when that profile is chosen |
| Project artifact | The `output` path in `manifest.json` | Always, subject to `ifExists` |

### `ifExists` policies

| Policy | Behaviour when the file exists |
|---|---|
| `merge-block` | Replaces only the text between `<!-- sdd-speckit:begin … -->` and `<!-- sdd-speckit:end -->`. With no such block, appends it. All other text is kept. |
| `replace-if-composed` | Replaces the file when its first lines carry the composed header. A file someone took over (header removed) is kept and reported as `skip-edited`. `--force` replaces it. |
| `skip` | Keeps the file. |

Every phase override uses `replace-if-composed`. A composed override that the current
composition no longer produces is removed, for example after the industry changes to `none`.

### The composed header

The first line of a composed file (after YAML frontmatter, if any):

```
<!-- sdd-speckit:composed industry=healthcare stack=python-fastapi inputs=3f9c0a1b2d4e — regenerate with the onboard phase; do not edit -->
```

`inputs` is the first 12 hex digits of a SHA-256 over every base template and every fragment that
was read. It changes when any input changes. The header holds no framework version, so the copy
pinned in a project and the plugin's copy produce the same bytes.

**Do not edit a composed file.** Put the change in a project-local fragment.

## How a command resolves a template

Every command that reads a template uses the same rule:

1. `.specify/templates/overrides/<file>`, when it exists.
2. Otherwise the framework's `templates/<file>`: `${CLAUDE_PLUGIN_ROOT}/templates/` in Claude
   Code, `.specify/sdd-speckit/templates/` in GitHub Copilot.

A line of the form `<!-- slot:… -->` in a base template is a marker for the composer. A command
never copies it into an artifact.

## Project-local fragments

Use this layer for a rule that belongs to one project. Example: every spec in this project needs
a data-residency requirement, and the pull request template needs a link to the change ticket.

`.specify/templates/fragments/spec-template.md`:

```markdown
<!-- @slot nfr-rows -->
| NFR-LOC-01 | Customer data stays in the EU region. | No store or log outside `eu-*`. | Deployment config |
```

`.specify/templates/fragments/project/pull_request_template.md`:

```markdown
<!-- @slot checklist-items -->
- [ ] The change ticket is linked: <!-- CHG-0000 -->
```

Then compose and commit:

```bash
python3 .specify/sdd-speckit/scripts/compose-templates.py --project .
git add .specify/templates .github/pull_request_template.md
```

The project-local layer comes last, so its rows follow the industry and stack rows. Use your own
id prefix (`NFR-LOC-…` here) so that the ids stay unique.

## Add a profile

### A stack profile

1. Create `profiles/stacks/<id>/profile.json`:

   ```json
   {
     "schema": 1, "kind": "stack", "id": "<id>", "label": "…", "description": "One sentence.",
     "defaults": { "language": "…", "framework": "…" },
     "recommendedMcp": ["github"],
     "harness": {
       "sourceGlobs": ["src/**"], "testGlobs": ["tests/**"],
       "commands": { "test": "…", "lint": "…", "format": "…", "lintFile": "… {file}" }
     },
     "permissions": { "allow": ["Bash(<test command>:*)"] }
   }
   ```

2. Add fragments. The shipped stacks overlay `plan-template.md` (replace
   `technical-context-rows` and `test-strategy-rows`, add stack conventions),
   `tasks-template.md` (the `S###` block), `project/AGENTS.md` (replace `commands`, add
   `conventions`), `project/sdd-gates.yml` (`stack-setup`) and `checklists/security-template.md`
   (`C-ST-nn` rows).
3. Optional: `vscode-extensions.json` with a `recommendations` list.
4. Run the lint.

Two fields of a stack's `profile.json` are read without a fragment:

| Field | What reads it | Effect |
|---|---|---|
| `defaults` | The composer | One `Area / Standard` table, written to `Annex T — Technology standards` in the constitution template and to `### Technology` in `AGENTS.md`. A key becomes the row label (`unitTest` → "Unit tests"). The layer is named `stack:<id>:defaults` and comes after the stack's own fragments. |
| `recommendedMcp` | Both installers and the setup phase | On a first run the listed connectors are pre-selected in the MCP question. A connector that needs a URL or a credential first is never pre-selected. With `--yes`, nothing is added. The lint rejects an id that is not in `mcp/catalog.json`. |

### An industry profile

See [INDUSTRY_PROFILES.md](INDUSTRY_PROFILES.md#add-an-industry).

`id` must equal the directory name, and `kind` must match the folder. The installers and the
setup phase list every directory that has a `profile.json`; no code change is needed.

## Composer CLI

```bash
python3 scripts/compose-templates.py --project DIR [--industry ID] [--stack ID] [--targets claude,copilot]
```

Without `--industry`, `--stack` or `--targets`, the values come from
`DIR/.specify/sdd-speckit.json`. The defaults are `none`, `custom` and `claude`.

| Flag | Effect | Exit code |
|---|---|---|
| (none) | Writes the composed files and prints one line per file | 0; 2 on a composition error |
| `--dry-run` | Prints what it would write. Writes nothing. | 0 |
| `--check` | Writes nothing. Reports each file that is stale or extra. | 1 when anything is stale |
| `--force` | Also replaces a composed file that someone took over | 0 |
| `--json` | Prints the context and the actions as JSON | as above |
| `--lint` | Checks the framework itself. Needs no `--project`. | 1 on any problem |
| `--list` | Prints every industry and stack profile as JSON | 0 |

`--lint` checks: every slot marker is well formed; every manifest entry is valid; every profile
has the required keys and valid regexes; no fragment breaks a profile rule; and every industry ×
stack combination (including `none` and `custom`) composes with no leftover marker, equal column
counts in every table, and no repeated id in a file.

Through the Node installer:

```bash
npx create-sdd-speckit-app --emit=templates .                       # compose for the recorded profiles
npx create-sdd-speckit-app --emit=templates . --industry=healthcare --stack=python-fastapi
npx create-sdd-speckit-app --emit=templates . --check               # exit 1 when stale
```

`--emit=templates` also accepts `--targets`, `--dry-run` and `--force`. It needs `python3`.

In a project, use the pinned copy, so that local runs and CI agree:

```bash
python3 .specify/sdd-speckit/scripts/compose-templates.py --project . --check
```

The generated `sdd-gates.yml` runs that command on every pull request.
