# Changelog

All notable changes to `sdd-speckit-framework`. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning is
[semantic](https://semver.org/spec/v2.0.0.html).

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
