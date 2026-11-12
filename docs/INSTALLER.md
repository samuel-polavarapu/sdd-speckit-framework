# Installer

Two implementations, one behaviour. Both ask the **same five questions in the same order** and
write the same files. Neither writes anything until every question is answered.

| Path | Command | Use when |
|---|---|---|
| Node (reference) | `npx create-sdd-speckit-app [dir]` | Node 18+ available |
| Bash (fallback) | `./installer/install.sh [dir]` | No Node. Delegates to Node when it finds it. |

Run straight from the repo with no publish step:

```bash
npx github:your-org/sdd-speckit-framework my-app
```

## The five questions

| # | Question | Default |
|---|---|---|
| 1 | Enable OpenTelemetry usage monitoring? | **off** |
| 2 | Which tech stack? | `custom` |
| 3 | Primary AI assistant? (plus optional secondaries, or **Both**) | `claude` |
| 4 | Which MCP connectors? (plus a custom-connector loop) | none |
| 5 | Preferred code editor? | `vscode` |

## Flags

Every answer is also a flag, so CI needs no TTY.

| Flag | Values | Default |
|---|---|---|
| `--yes` | — | interactive unless absent TTY |
| `--telemetry=` | `on` \| `off` | `off` |
| `--otel-exporter=` | `console` \| `otlp` | `console` |
| `--otel-endpoint=` | URL | — (required for `otlp`) |
| `--stack=` | `web-fullstack-node` \| `python-fastapi` \| `dotnet-aspire` \| `custom` | `custom` |
| `--assistant=` | `claude` \| `copilot` \| `both` \| `cursor` \| `other` | `claude` |
| `--secondary-assistants=` | comma separated | — |
| `--mcp=` | comma separated ids from `mcp/catalog.json` | none |
| `--mcp-custom=` | `<name>:<transport>:<url-or-command>`, repeatable | — |
| `--mcp-input=` | `<id>.<field>=<value>`, repeatable | — |
| `--editor=` | `vscode` \| `cursor` \| `jetbrains` \| `none` | `vscode` |
| `--dry-run` | — | off |
| `--no-speckit` | — | off |
| `--force-interactive` | — | off (asks the five questions without a TTY) |
| `--no-node` | bash only — do not delegate | off |
| `--emit=copilot [dir]` | render only the Copilot files, no questions | — |
| `--emit=copilot --check [--strict] [dir]` | exit 1 if `dir` differs from a fresh render | — |

### Which assistant gets files

| `--assistant` (+ secondaries) | Claude Code files | GitHub Copilot files |
|---|---|---|
| `claude` | yes | no |
| `copilot` | no | yes |
| `both` (= `claude` + secondary `copilot`) | yes | yes |
| `cursor` or `other`, no Claude/Copilot secondary | yes (as before 0.2.0) | no |

`specify init` runs once for the primary assistant's integration, and once more for Claude Code
or Copilot when either is a secondary.

```bash
npx create-sdd-speckit-app my-app --yes \
  --stack=python-fastapi --assistant=claude --telemetry=off \
  --mcp=github,playwright --mcp-custom=acme:http:https://mcp.acme.example/mcp \
  --editor=vscode
```

**A tenant-hosted connector has no default URL.** Rally is the shipped example. Non-interactively
you must supply it, or the run **fails before writing anything**:

```bash
--mcp=rally --mcp-input=rally.url=https://your-host/mcp --mcp-input=rally.credentialEnvVar=RALLY_API_KEY
```

## What gets written

| File | Content |
|---|---|
| `.specify/` | From `specify init --integration <key>`, or the vendored templates |
| `.specify/templates/overrides/` | The chosen preset's `plan-template.md` and `tasks-template.md` |
| `.specify/sdd-speckit.json` | All five answers plus `assistant.targets` (`configVersion: 2`). Canonical, safe to commit. |
| `.mcp.json` | Chosen catalog picks plus every custom entry, under `mcpServers`. Read by both assistants. |
| `.vscode/` or `.idea/` | Per `editors/editor-map.json`, with the extension or plugin of every chosen assistant |
| **Claude Code target** | |
| `.claude/sdd-speckit/` | `commands/ agents/ skills/ hooks/ templates/` |
| `.claude/settings.json` | **`env` only** — the OTel variables. Merged, never clobbered. |
| `scripts/otel-collector/` | Only for `--telemetry=on --otel-exporter=otlp` |
| **GitHub Copilot target** | |
| `.github/skills/`, `.github/agents/`, `.github/hooks/sdd-speckit.json` | Rendered from the Claude Code sources. See [COPILOT.md](COPILOT.md). |
| `.github/copilot-instructions.md` | A marked block, merged. Your own text outside the markers is kept. |
| `.specify/sdd-speckit/` | Templates, presets, MCP catalog, hook scripts — what `${CLAUDE_PLUGIN_ROOT}` is in Claude Code |

The five answers live in `.specify/sdd-speckit.json`, not in `.claude/settings.json`, because
`settings.json` has a defined schema and this framework's config is not part of it.

## Registering the plugin — the shell-versus-slash caveat (Claude Code)

Copying files works, but **registering the plugin is better**: `/plugin update` then upgrades it.

`claude plugin ...` as a plain shell subcommand was inconsistent across Claude Code
versions. The installer probes `claude plugin --help` at runtime and prints whichever form works,
always with the slash-command fallback.

```bash
# Shell, when available (verified present in Claude Code 2.1.236):
claude plugin marketplace add /path/to/sdd-speckit-framework
claude plugin install sdd-speckit@sdd-speckit-framework

# Always works — inside an interactive session:
/plugin marketplace add /path/to/sdd-speckit-framework
/plugin install sdd-speckit@sdd-speckit-framework

# Local development, no marketplace:
claude --plugin-dir /path/to/sdd-speckit-framework
```

For containers and CI, `CLAUDE_CODE_PLUGIN_SEED_DIR` provisions plugins at image build time.

GitHub Copilot has nothing to register. Commit `.github/` and `.specify/sdd-speckit/`.

## Telemetry — and how it differs from `DISABLE_TELEMETRY`

Telemetry covers **Claude Code only**. With GitHub Copilot as the only target, the answer is
recorded and nothing is written.

**Two unrelated controls. Do not conflate them.**

| | This framework's opt-in | Anthropic's `DISABLE_TELEMETRY` |
|---|---|---|
| Controls | **Your** OpenTelemetry metrics, to **your** collector | Anthropic's own usage reporting |
| Set by | `CLAUDE_CODE_ENABLE_TELEMETRY=1` in `.claude/settings.json` | `DISABLE_TELEMETRY=1` in your environment |
| Default | **off** — nothing is emitted until you opt in | Anthropic's own default. This framework does not change it. |
| Data goes to | `console`, or your own OTLP endpoint | Anthropic |
| Changed with | `/sdd-speckit:speckit.setup telemetry` | your own env or enterprise policy |

Turning this framework's telemetry **on** sends nothing to Anthropic. Turning it **off** does not
change Anthropic's setting. The installer never writes `DISABLE_TELEMETRY`.

Opting out **removes** the OTel keys rather than setting them to `0`, since a literal `0` reads as
a considered opt-out of something that was on.

## Reconfiguring later

`/sdd-speckit:speckit.setup` (Copilot: `/sdd-speckit-setup`) asks the same five questions
in-session, shows the current value for each, and offers keep-or-change. Narrow it with an
argument: `/sdd-speckit:speckit.setup mcp`.

## Related

[MCP connectors](MCP_CONNECTORS.md) · [Onboarding](../ONBOARDING.md) ·
[Model routing](MODEL_ROUTING.md) · [Architecture](ARCHITECTURE.md) · [GitHub Copilot](COPILOT.md)
