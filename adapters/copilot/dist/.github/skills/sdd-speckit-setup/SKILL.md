---
name: "sdd-speckit-setup"
description: "Configure or reconfigure the five framework choices from inside a session — telemetry, tech stack, primary assistant, MCP connectors, editor. The installer's questions, after the fact."
argument-hint: "[telemetry | stack | assistant | mcp | editor — blank walks all five]"
disable-model-invocation: true
---

<!-- Generated from commands/speckit.setup.md by sdd-speckit-framework. Edit the source, then re-run --emit=copilot. -->

> **SDD Speckit phase `setup`.** Model tier: **sonnet**.

# Reconfigure — the installer's five questions, in session

Use this when the plugin was installed by hand, or when a choice needs to change. It asks the
same five questions in the same order as `create-sdd-speckit-app`, and writes the same files.

## Read first — always, before asking anything

| File | What you learn |
|---|---|
| `.specify/sdd-speckit.json` | The current five answers. Absent means first-time setup. |
| `.claude/settings.json` | Whether telemetry env vars are already set (Claude Code only). |
| `.mcp.json` | Which connectors are already wired. |
| `.vscode/extensions.json`, `.idea/externalDependencies.xml` | Which editor is already wired. |
| `.specify/sdd-speckit/mcp/catalog.json` | The connector catalog to offer. |
| `.specify/sdd-speckit/presets/*/preset.json` | The stack presets to offer. |
| `.specify/sdd-speckit/editors/editor-map.json` | The editor choices to offer. |

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
**Both — Claude Code and GitHub Copilot** · **Cursor** (`cursor-agent`) · **other** (`generic`).
Unless the answer was *Both*, offer an optional multi-select of secondary assistants from the same
list. *Both* is recorded as primary `claude`, secondary `["copilot"]`.

The assistants chosen decide the **targets**: Claude Code files are written when `claude` is
chosen (or when neither `claude` nor `copilot` is), and GitHub Copilot files when `copilot` is.
Record them as `assistant.targets`.

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

| Target | When | Content |
|---|---|---|
| `.specify/sdd-speckit.json` | always | All five answers, with `configVersion: 2` and `assistant.targets`. The canonical record, safe to commit. |
| `.mcp.json` | always | Merge the chosen `mcp/snippets/*.json` plus every custom entry under `mcpServers`. Claude Code and GitHub Copilot both read this file. |
| `.specify/templates/overrides/` | always | The chosen preset's `plan-template.md` and `tasks-template.md`. |
| `.claude/settings.json` | Claude Code target | `env` only: `CLAUDE_CODE_ENABLE_TELEMETRY`, `OTEL_METRICS_EXPORTER`, `OTEL_EXPORTER_OTLP_ENDPOINT`. Merge; do not clobber other keys. |
| `.github/` + `.specify/sdd-speckit/` | GitHub Copilot target | Run `npx create-sdd-speckit-app . --emit=copilot` (needs Node 18+). It renders the Copilot skills, custom agents, hooks and instructions from this framework's sources. Do not hand-write them. |
| `.vscode/` or `.idea/` | always | Copy per `editors/editor-map.json`, recommending the extension or plugin of **every** chosen target. |

On telemetry **off**, remove those three env keys rather than setting them to `0`, and leave the
rest of `settings.json` untouched. Telemetry covers Claude Code only. With GitHub Copilot as the
only target, say so and skip the question's write.

## Report

- A table of every choice: previous value, new value.
- Every file you wrote.
- **Which connectors still need a one-time authorization.** Writing `.mcp.json` does not
  complete an OAuth login. In Claude Code, run `/mcp`. In GitHub Copilot, start the server when
  VS Code or the Copilot CLI asks.
- Any credential the user must still supply, and the env var name it belongs in.

Then say: next run `/sdd-speckit-constitution`.
