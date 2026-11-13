# Changelog

All notable changes to `sdd-speckit-framework`. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning is
[semantic](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-11-13

Artifact templates that vary by industry and technology, onboarding for new and existing
codebases, and a harness of deterministic gates.

### Added

- **Layered templates.** Base templates carry named slots. `scripts/compose-templates.py` joins
  base, industry profile, stack profile and project-local fragments (in that order) into
  `.specify/templates/overrides/`. It has `--check`, `--lint`, `--list`, `--dry-run` and `--force`.
  See `docs/TEMPLATES.md`.
- **Industry profiles** in `profiles/industries/`: `general-saas`, `healthcare`,
  `financial-services`, `public-sector`. Each adds gates, requirements, design sections,
  regulatory tasks and checklist rows, and ships its own checklists (`soc2-change`,
  `hipaa-safeguards`, `phi-handling`, `pci-scope`, `sox-change`, `ato-readiness`, `section-508`).
  See `docs/INDUSTRY_PROFILES.md`.
- **New base templates.** Contract, ADR, implementation log, analyze report, converge report,
  discovery report, baseline spec, adoption roadmap. Five checklist kinds: requirements,
  security, privacy, accessibility, release.
- **Project artifacts**, generated per project: `AGENTS.md`, `CLAUDE.md`,
  `.github/workflows/sdd-gates.yml`, pull request and issue templates, `CODEOWNERS`, a first ADR.
  An existing `AGENTS.md` or `CLAUDE.md` keeps its text; the framework owns a marked block.
- **Harness gates.** `scripts/harness/gate.py` runs six gates in the assistant hooks and in CI:
  `constitution-guard`, `spec-before-code`, `tasks-before-implement`, `test-first`,
  `secrets-scan`, `lint-format`. Each is `off`, `warn` or `block`. Greenfield starts at `block`.
  Brownfield starts the process gates at `warn`. See `docs/HARNESS.md`.
- **Onboarding.** Commands `speckit.onboard`, `speckit.discover` and `speckit.baseline`, the
  read-only `codebase-cartographer` agent, and the scripts `onboard-project.py` and
  `discover-scan.py`. See `docs/ONBOARDING-GREENFIELD-BROWNFIELD.md`.
- **Installer.** Eight questions instead of five: project mode, industry and harness gates are
  new. Flags `--mode`, `--industry`, `--gates`, `--gate`, and `--emit=templates [--check]`.
- **`.specify/sdd-speckit/`** is written for every target: a pinned copy of the templates,
  profiles, composer and gate runner, so hooks and CI need no plugin.
- **Permission rules** in the generated `.claude/settings.json`: a baseline, plus the stack
  profile's build and test commands.
- **gitleaks in the CI secrets scan.** `gate.py ci` also runs `gitleaks` over the pull request's
  commits when it is installed. `harness.gitleaks` is `auto`, `off` or `required`.
- **Stack `defaults` are composed.** A stack profile's `defaults` become
  `Annex T — Technology standards` in the constitution template and a `### Technology` table in
  `AGENTS.md`.
- **Stack `recommendedMcp` is pre-selected** in the MCP question of both installers.
- **`checklistKinds`** from the industry profile is recorded in `.specify/sdd-speckit.json`, and
  the checklist phase offers the kinds a feature still lacks.
- **Tests.** A `node:test` suite (`npm test`, 44 tests): frontmatter, config migration, scaffold,
  composer, gate runner, and parity between the two installers.

### Changed

- **`presets/` is now `profiles/stacks/`**, as fragments instead of full template copies. The
  stack ids are the same. A stack-only composition gives the same plan and tasks templates as
  0.2.0, plus one header line.
- **`.specify/sdd-speckit.json` moves to `configVersion: 3`**, with `mode`, `industry` and a
  `harness` block.
- **Every template-reading command** reads `.specify/templates/overrides/` first. In 0.2.0 only
  plan and tasks did.
- **The phase commands write `.specify/.active-spec`**, which the gates read.
- **`speckit.constitution`** derives principles from a discovery report in a brownfield project,
  and marks each one observed or aspirational.
- **`speckit.checklist`** starts from the template of its kind and keeps the profile rows. The
  fifteen-item limit became a limit of ten added items.
- **`speckit.implement`** writes `implementation-log.md`. **`speckit.converge`** writes
  `converge-report.md`. **`speckit.analyze`** checks a seventh axis, profile controls.
- **`speckit.setup`** asks the eight questions and runs the onboarding script.
- **`install.sh`** has the same questions and flags as the Node installer, keeps earlier answers
  on a second run, and no longer needs bash 4.
- **The constitution guard** is now one gate of the runner. `guard-constitution.sh` is a shim.
- **A second installer run keeps earlier answers.** In 0.2.0 it overwrote them with the defaults.

### Migration from 0.2.0

- **Nothing starts blocking on upgrade.** A record with no `harness.gates` keeps the constitution
  guard and nothing else. Pass `--mode` or `--gates` to the installer, or run
  `/sdd-speckit:speckit.setup gates`, to opt in.
- **Re-run the installer or `/sdd-speckit:speckit.onboard`** to get the composed templates. A
  0.2.0 `plan-template.md` or `tasks-template.md` in the overrides directory has no composed
  header, so it counts as edited by hand and is kept. Delete it, or pass `--force` to
  `onboard-project.py`, to replace it.
- **The interactive question order changed.** A script that pipes answers by position must be
  updated. Flags are unchanged.
- A script or document that reads `presets/<id>/` must read `profiles/stacks/<id>/`.
- `python3` is now needed for templates and gates, not only for the hooks.

### Not verified

- The gates and the three onboarding commands were tested with fixture payloads and temporary
  repositories. They were not run inside a live Claude Code or GitHub Copilot session.
- The `gitleaks` step was tested with a stand-in binary that writes a report in the gitleaks
  JSON format. It was not run against a real `gitleaks` release.
- The control citations in the industry profiles were written from model knowledge and were not
  checked against the standards. Each profile is engineering guidance, not compliance advice.
  Have the organisation's compliance owner review a profile before you rely on it.

## [0.2.0] — 2026-11-13

GitHub Copilot support. You can pick Claude Code, GitHub Copilot or both. Each phase is still
written once.

### Added

- **GitHub Copilot adapter**: `installer/create-sdd-speckit-app/src/copilot.js`, driven by
  `adapters/copilot/adapter.json` (tier, tool and routing maps). It renders, from the Claude Code
  sources:
  - 10 phase skills (`.github/skills/sdd-speckit-*`, user-invoked only).
  - 7 custom agents, plus `qa-analyst-readonly` (`.github/agents/`).
  - The shared skills (`speckit-workflow`, `raci-lookup`, `asd-ste100`).
  - `.github/hooks/sdd-speckit.json` (constitution guard and artifact changelog).
  - A merged, marked block in `.github/copilot-instructions.md`.
  - `.specify/sdd-speckit/` (templates, presets, catalogs, hook scripts).
- **`--assistant=both`** in both installers and in `speckit.setup`. It records
  `assistant.targets`, and `.specify/sdd-speckit.json` moves to `configVersion: 2`.
- **`--emit=copilot [--check [--strict]] [dir]`**: adds Copilot support to an existing repo, or
  checks a render for drift.
- **`adapters/copilot/dist/`**: the committed render, for the bash installer and for copying by
  hand. Two npm scripts keep it in step: `npm run render:copilot` and `npm run check:copilot`.
- **`docs/COPILOT.md`**: the primitive mapping, model tiers, read-only enforcement, and the limits.
- Source markers `<!-- claude-only:start/end -->` and `<!-- copilot-only … -->` for passages that
  are true for only one assistant.

### Changed

- **Hook scripts** read both the Claude Code (`tool_name`/`tool_input`) and the Copilot
  (`toolName`/`toolArgs`) payloads through `scripts/hooks/_payload.py`. They also handle
  `apply_patch` targets and filter by tool name themselves. The guard also prints a Copilot
  `permissionDecision: deny`.
- **Editor scaffolding** recommends the extension or plugin of every chosen assistant. The source
  is `editor-map.json` → `assistants`: `github.copilot`, `github.copilot-chat` and
  `com.github.copilot` for Copilot. The JetBrains `externalDependencies.xml` is now rendered from a
  template.
- **Claude Code-only parts.** `.claude/` files, telemetry env vars and the OTel collector are
  written only for a Claude Code target.
- **`specify init`** runs once per integration when Claude Code and Copilot are both targets.
- **`speckit.plan`** reads the stack preset from `.specify/sdd-speckit.json`, not
  `.claude/settings.json`.

### Verified at build time (2026-11-13)

- **Copilot hooks.** Copilot reads `.github/hooks/*.json` with `version: 1`, camelCase
  `preToolUse`/`postToolUse`, and `toolName`/`toolArgs` on stdin. Exit code 2 denies.
- **Copilot MCP.** Copilot reads the workspace-root `.mcp.json` (`mcpServers`, `${VAR}`), so no
  second MCP file is written. `.vscode/mcp.json` is the deprecated Local-harness format. The
  Copilot cloud agent's MCP is configured in repository settings.
- **Prompt files.** `.github/prompts/*.prompt.md` run only in VS Code's Local harness, which is
  deprecated and removed in February 2027, so the phases are skills instead.
- **Speckit.** `specify init --integration copilot` (spec-kit `2ee2b1e`) writes `.github/skills/speckit-*`.
  Those names do not collide with `sdd-speckit-*`.

## [0.1.0] — 2026-09-10

First release.

### Added

- **Claude Code plugin** (`sdd-speckit`) — `plugin.json` and a self-hosting `marketplace.json`.
- **10 slash commands** — one per Speckit phase (`constitution`, `specify`, `clarify`, `plan`,
  `checklist`, `tasks`, `analyze`, `implement`, `converge`) plus `setup` for in-session
  reconfiguration. Each declares its model tier in frontmatter. `analyze` is read-only by removed
  tools, not by instruction.
- **7 subagents** — `spec-author` (sonnet), `solution-architect` (opus), `task-planner` (sonnet),
  `qa-analyst` (opus), `implementer` (sonnet), `code-reviewer` (opus), `research-scout` (haiku),
  each with a scoped tool set.
- **4 skills** — `speckit-workflow`, `raci-lookup`, `telemetry-report`, and `asd-ste100`
  (vendored from `danyuchn/asd-ste100-skill`, MIT, with attribution).
- **4 lifecycle hooks** — a `PreToolUse` constitution guard using an unlock marker, a `PostToolUse`
  artifact changelog, a `SessionStart` model-tier reminder, and a `SessionEnd` usage line that is
  silent unless telemetry is on.
- **8 artifact templates** for the full Speckit set, keeping `[NEEDS CLARIFICATION]` and
  `[PLACEHOLDER]` markers.
- **3 tech-stack presets** — `web-fullstack-node`, `python-fastapi`, `dotnet-aspire` — each
  overriding `plan-template.md` and `tasks-template.md` and contributing a VS Code extension
  fragment.
- **MCP connector catalog** — GitHub, Atlassian, Figma, Playwright, Lucid, Rally, with `.mcp.json`
  fragments and a JSON Schema for custom connectors.
- **Editor scaffolding** — VS Code and Cursor via `.vscode/`, JetBrains via
  `.idea/externalDependencies.xml`, driven by `editor-map.json`.
- **Interactive installer** — `create-sdd-speckit-app` (Node, reference) and `install.sh` (bash
  fallback). Both ask five questions in a fixed order before writing anything, and both accept
  every answer as a flag for CI.
- **Optional local OTel collector** — Docker Compose plus config, scaffolded only for the `otlp`
  exporter.
- **Docs** — README, ONBOARDING, RACI, ARCHITECTURE, MODEL_ROUTING, INSTALLER, MCP_CONNECTORS.

### Verified at build time

Endpoints and identifiers confirmed on 2026-09-10 rather than assumed:

- JetBrains plugin id `com.anthropic.code.plugin` (Marketplace listing 27310, Anthropic PBC).
- VS Code extension id `anthropic.claude-code`.
- Atlassian `https://mcp.atlassian.com/v2/mcp` — `/v1/sse` was sunset 30 June 2026.
- Figma `https://mcp.figma.com/mcp` · Lucid `https://mcp.lucid.app/mcp` ·
  GitHub `https://api.githubcopilot.com/mcp/` · Playwright `npx @playwright/mcp@latest`.
- Speckit integration keys: `claude`, `copilot`, `cursor-agent`, `generic`.
- `specify init --integration claude` writes hyphenated skills into `.claude/skills/`
  (`speckit-plan`, invoked as `/speckit-plan`), so this plugin's dotted, namespaced commands
  (`/sdd-speckit:speckit.plan`) do not collide with them.
- `claude plugin` shell subcommands present in Claude Code 2.1.236. The slash-command fallback is
  documented regardless.

### Deliberately not included

- **No model-switching hook.** Claude Code has no mechanism for it. Commands and subagents carry
  their own `model:`. The `SessionStart` hook is advisory text.
- **No default Rally endpoint.** Rally MCP is tenant-hosted, so the installer collects the URL or
  fails rather than writing a guess.
- **No reimplementation of Speckit.** The installer delegates to `specify init` and uses vendored
  templates only as a disclosed fallback.
