---
name: speckit.setup
description: Configure or reconfigure the five framework choices from inside a session — telemetry, tech stack, primary assistant, MCP connectors, editor. The installer's questions, after the fact.
argument-hint: "[telemetry | stack | assistant | mcp | editor — blank walks all five]"
model: sonnet
---

# Reconfigure — the installer's five questions, in session

Use this when the plugin was installed by hand, or when a choice needs to change. It asks the
same five questions in the same order as `create-sdd-speckit-app`, and writes the same files.

## Read first — always, before asking anything

| File | What you learn |
|---|---|
| `.specify/sdd-speckit.json` | The current five answers. Absent means first-time setup. |
| `.claude/settings.json` | Whether telemetry env vars are already set. |
| `.mcp.json` | Which connectors are already wired. |
| `.vscode/extensions.json`, `.idea/externalDependencies.xml` | Which editor is already wired. |
| `${CLAUDE_PLUGIN_ROOT}/mcp/catalog.json` | The connector catalog to offer. |
| `${CLAUDE_PLUGIN_ROOT}/presets/*/preset.json` | The stack presets to offer. |
| `${CLAUDE_PLUGIN_ROOT}/editors/editor-map.json` | The editor choices to offer. |

**Show the current value for every question and offer keep-or-change.** Never re-ask a settled
question as though it were unanswered. With an argument, walk only that one question.

## The five questions, in this order

### 1. Telemetry — off unless asked for

> Enable OpenTelemetry usage monitoring for this project? (y/N)
> It emits local metrics about session and token counts. It sends nothing to Anthropic.

On yes, ask the exporter: `console` (prints locally, no setup) or `otlp` (needs an endpoint). For
`otlp`, ask for the endpoint URL.

### 2. Tech stack

Single-select over `presets/*/preset.json`, plus **custom / skip**. Show each preset's label and
one-line description.

### 3. Primary AI assistant

Single-select: **Claude Code** (default, Speckit key `claude`) · **GitHub Copilot** (`copilot`) ·
**Cursor** (`cursor-agent`) · **other** (`generic`). Then offer an optional multi-select of
secondary assistants from the same list.

### 4. MCP connectors

Multi-select over `mcp/catalog.json`. For each, show the description and whether it needs OAuth or
a credential up front. Then loop: **add a custom MCP server?** — name, transport
(`http`/`sse`/`stdio`), URL or command, optional header or env var — until the user is done.

**Rally has no public endpoint.** It is tenant-hosted. Prompt for the organization's own Rally MCP
URL and credential. Never write a default or a guessed hostname.

### 5. Preferred code editor

Single-select: **VS Code** (default) · **JetBrains** (IntelliJ IDEA, PyCharm, WebStorm, Rider) ·
**other** · **none**.

## Then write

| Target | Content |
|---|---|
| `.specify/sdd-speckit.json` | All five answers. The canonical record, safe to commit. |
| `.claude/settings.json` | `env` only: `CLAUDE_CODE_ENABLE_TELEMETRY`, `OTEL_METRICS_EXPORTER`, `OTEL_EXPORTER_OTLP_ENDPOINT`. Merge; do not clobber other keys. |
| `.mcp.json` | Merge the chosen `mcp/snippets/*.json` plus every custom entry under `mcpServers`. |
| `.vscode/` or `.idea/` | Copy per `editors/editor-map.json`. |
| `.specify/templates/overrides/` | The chosen preset's `plan-template.md` and `tasks-template.md`. |

On telemetry **off**, remove those three env keys rather than setting them to `0`, and leave the
rest of `settings.json` untouched.

## Report

- A table of every choice: previous value, new value.
- Every file you wrote.
- **Which connectors still need a one-time `/mcp` authorization in this session.** Writing
  `.mcp.json` does not complete an OAuth login.
- Any credential the user must still supply, and the env var name it belongs in.

Then say: next run `/sdd-speckit:speckit.constitution`.
