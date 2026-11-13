---
name: speckit.setup
description: Configure or reconfigure the eight framework choices from inside a session — telemetry, project mode, industry, tech stack, primary assistant, MCP connectors, editor, harness gates. The installer's questions, after the fact.
argument-hint: "[telemetry | mode | industry | stack | assistant | mcp | editor | gates — blank walks all eight]"
model: sonnet
---

# Reconfigure — the installer's eight questions, in session

Use this when the plugin was installed by hand, or when a choice needs to change. It asks the
same eight questions in the same order as `create-sdd-speckit-app`, and writes the same files.

## Read first — always, before asking anything

| File | What you learn |
|---|---|
| `.specify/sdd-speckit.json` | The current eight answers. Absent means first-time setup. |
| `.claude/settings.json` | Whether telemetry env vars are already set (Claude Code only). |
| `.mcp.json` | Which connectors are already wired. |
| `.vscode/extensions.json`, `.idea/externalDependencies.xml` | Which editor is already wired. |
| `${CLAUDE_PLUGIN_ROOT}/mcp/catalog.json` | The connector catalog to offer. |
| `${CLAUDE_PLUGIN_ROOT}/profiles/industries/*/profile.json` | The industry profiles to offer, and the standards each cites. |
| `${CLAUDE_PLUGIN_ROOT}/profiles/stacks/*/profile.json` | The stack profiles to offer. |
| `${CLAUDE_PLUGIN_ROOT}/scripts/harness/gates.json` | The gates, their modes, and the defaults per project mode. |
| `${CLAUDE_PLUGIN_ROOT}/editors/editor-map.json` | The editor choices to offer. |

**Show the current value for every question and offer keep-or-change.** Never re-ask a settled
question as though it were unanswered. With an argument, walk only that one question.

## The eight questions, in this order

### 1. Telemetry — off unless asked for

> Enable OpenTelemetry usage monitoring for this project? (y/N)
> It emits local metrics about session and token counts. It sends nothing to Anthropic.

On yes, ask the exporter: `console` (prints locally, no setup) or `otlp` (needs an endpoint). For
`otlp`, ask for the endpoint URL.

### 2. Project mode

Single-select: **greenfield** (a new codebase) or **brownfield** (existing code). Run
`python3 "${CLAUDE_PLUGIN_ROOT}/scripts/discover-scan.py" . --brief` and offer its proposal first,
with the evidence it gives. The mode sets the gate defaults in question 8 and the route after
onboarding.

### 3. Industry

Single-select over `profiles/industries/*/profile.json`, plus **none**. Show each profile's label
and the standards it cites. The profile adds regulatory gates, requirements, tasks and checklists
to the templates. Never choose for the user. Say that a profile is engineering guidance, and that
the organisation's compliance owner must confirm it.

### 4. Tech stack

Single-select over `profiles/stacks/*/profile.json`, plus **custom / skip**. Show each profile's
label and one-line description, and offer the scan's proposal first.

### 5. Primary AI assistant

Single-select: **Claude Code** (default, Speckit key `claude`) · **GitHub Copilot** (`copilot`) ·
**Both — Claude Code and GitHub Copilot** · **Cursor** (`cursor-agent`) · **other** (`generic`).
Unless the answer was *Both*, offer an optional multi-select of secondary assistants from the same
list. *Both* is recorded as primary `claude`, secondary `["copilot"]`.

The assistants chosen decide the **targets**: Claude Code files are written when `claude` is
chosen (or when neither `claude` nor `copilot` is), and GitHub Copilot files when `copilot` is.
Record them as `assistant.targets`.

### 6. MCP connectors

Multi-select over `mcp/catalog.json`. For each, show the description and whether it needs OAuth or
a credential up front. Then loop: **add a custom MCP server?** — name, transport
(`http`/`sse`/`stdio`), URL or command, optional header or env var — until the user is done.

**Rally has no public endpoint.** It is tenant-hosted. Prompt for the organization's own Rally MCP
URL and credential. Never write a default or a guessed hostname.

### 7. Preferred code editor

Single-select: **VS Code** (default) · **JetBrains** (IntelliJ IDEA, PyCharm, WebStorm, Rider) ·
**other** · **none**.

### 8. Harness gates

Show the six gates from `gates.json` with the current mode of each: `constitution-guard`,
`spec-before-code`, `tasks-before-implement`, `test-first`, `secrets-scan`, `lint-format`. Offer:

- **Defaults for the mode** — greenfield: every gate at `block`. Brownfield: `warn`, except
  `constitution-guard` and `secrets-scan`, which stay at `block`.
- **Choose per gate** — `off`, `warn` or `block` for each.

`warn` records the finding in `.specify/harness-log.jsonl` and lets the write through. `block`
stops it and names what is missing. **Lower a gate only when the user asks for that gate by
name.** In a brownfield project with an adoption roadmap, moving a gate to `block` also needs a
row in the roadmap's ratchet log: add it, with the evidence the user gives.

## Then write

| Target | When | Content |
|---|---|---|
| `.specify/sdd-speckit.json` | always | All eight answers, with `configVersion: 3`, `assistant.targets` and the `harness` block. The canonical record, safe to commit. |
| `.mcp.json` | always | Merge the chosen `mcp/snippets/*.json` plus every custom entry under `mcpServers`. Claude Code and GitHub Copilot both read this file. |
| Templates, project artifacts and gate wiring | always, after the record is written | Run `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/onboard-project.py" --project .` and add `--mode`, `--industry`, `--stack`, `--gates` or `--gate <id>=<mode>` for each answer that changed. It pins `.specify/sdd-speckit/`, composes `.specify/templates/overrides/` and the project files (`AGENTS.md`, `CLAUDE.md`, `.github/workflows/sdd-gates.yml`, the pull request and issue templates), and merges the permission rules and gate hooks into `.claude/settings.json`. Preview with `--dry-run` first. Do not write these files by hand. |
| `.claude/settings.json` | Claude Code target | `env` keys: `CLAUDE_CODE_ENABLE_TELEMETRY`, `OTEL_METRICS_EXPORTER`, `OTEL_EXPORTER_OTLP_ENDPOINT`. Merge; do not clobber other keys, and leave `permissions` and `hooks` to the script. |
| `.github/` + `.specify/sdd-speckit/` | GitHub Copilot target | Run `npx create-sdd-speckit-app . --emit=copilot` (needs Node 18+) **before** the script above. It renders the Copilot skills, custom agents, hooks and instructions from this framework's sources. Do not hand-write them. |
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

Then say: next run `/sdd-speckit:speckit.onboard` when the project is not onboarded yet. After
that: `/sdd-speckit:speckit.constitution` in a greenfield project, `/sdd-speckit:speckit.discover`
in a brownfield one.
