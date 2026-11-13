# Installer

Two implementations, one behaviour. Both ask the **same eight questions in the same order** and
write the same files. Neither writes anything until every question is answered. A test
(`test/parity.test.js`) runs both with the same flags and compares every file.

| Path | Command | Use when |
|---|---|---|
| Node (reference) | `npx create-sdd-speckit-app [dir]` | Node 18+ available |
| Bash (fallback) | `./installer/install.sh [dir]` | No Node. Delegates to Node when it finds it. |

Run straight from the repo with no publish step:

```bash
npx github:your-org/sdd-speckit-framework my-app
```

## The eight questions

| # | Question | Default |
|---|---|---|
| 1 | Enable OpenTelemetry usage monitoring? | **off** |
| 2 | New project or existing codebase? | what a scan of the directory finds: `brownfield` when it holds code, otherwise `greenfield` |
| 3 | Which industry or domain? | `none` |
| 4 | Which tech stack? | the detected stack, otherwise `custom` |
| 5 | Primary AI assistant? (plus optional secondaries, or **Both**) | `claude` |
| 6 | Which MCP connectors? (plus a custom-connector loop) | none with `--yes`; interactively, the stack profile's `recommendedMcp` are pre-selected |
| 7 | Preferred code editor? | `vscode` |
| 8 | How strict are the harness gates? | the defaults for the mode |

**Question order changed in 0.3.0.** A script that pipes answers to the interactive prompts by
position must be updated. Flags are not affected.

Questions 2 to 4 choose what the templates contain. See [TEMPLATES.md](TEMPLATES.md) and
[INDUSTRY_PROFILES.md](INDUSTRY_PROFILES.md). Question 8 sets the gates. See
[HARNESS.md](HARNESS.md).

### Running it again

Run the installer again in the same directory to change an answer. **An answer you do not give
again is kept**, including the harness globs and commands a team has tuned in the record.

A record written before 0.3.0 has no gates. It keeps its old behaviour, the constitution guard
only, until you pass `--mode` or `--gates`. That is the opt-in to the gate defaults.

## Flags

Every answer is also a flag, so CI needs no TTY.

| Flag | Values | Default |
|---|---|---|
| `--yes` | — | interactive unless absent TTY |
| `--telemetry=` | `on` \| `off` | `off` |
| `--otel-exporter=` | `console` \| `otlp` | `console` |
| `--otel-endpoint=` | URL | — (required for `otlp`) |
| `--mode=` | `greenfield` \| `brownfield` \| `auto` | `auto` |
| `--industry=` | `general-saas` \| `healthcare` \| `financial-services` \| `public-sector` \| `none` | `none` |
| `--stack=` | `web-fullstack-node` \| `python-fastapi` \| `dotnet-aspire` \| `custom` \| `auto` | `custom` |
| `--assistant=` | `claude` \| `copilot` \| `both` \| `cursor` \| `other` | `claude` |
| `--secondary-assistants=` | comma separated | — |
| `--mcp=` | comma separated ids from `mcp/catalog.json` | none |
| `--mcp-custom=` | `<name>:<transport>:<url-or-command>`, repeatable | — |
| `--mcp-input=` | `<id>.<field>=<value>`, repeatable | — |
| `--editor=` | `vscode` \| `cursor` \| `jetbrains` \| `none` | `vscode` |
| `--gates=` | `default` \| `off` \| `warn` \| `block` — all gates at once | `default` |
| `--gate=` | `<id>=<off\|warn\|block>`, repeatable. Ids: `constitution-guard`, `spec-before-code`, `tasks-before-implement`, `test-first`, `secrets-scan`, `lint-format`, `destructive-commands`, `human-approval` | — |
| `--dry-run` | — | off |
| `--no-speckit` | — | off |
| `--force-interactive` | Node only | off (asks the eight questions without a TTY) |
| `--no-node` | bash only — do not delegate | off |
| `--emit=copilot [dir]` | render only the Copilot files, no questions | — |
| `--emit=copilot --check [--strict] [dir]` | exit 1 if `dir` differs from a fresh render | — |
| `--emit=templates [dir]` | Node only. Compose the templates for the recorded, or the given, industry and stack. No questions | — |
| `--emit=templates --check [dir]` | exit 1 if a composed file is stale | — |

Gate defaults by mode:

| Mode | `constitution-guard` | `secrets-scan` | the other four gates |
|---|---|---|---|
| `greenfield` | `block` | `block` | `block` |
| `brownfield` | `block` | `block` | `warn` |

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

# An existing repository, in a regulated domain, with one gate tightened:
npx create-sdd-speckit-app . --yes --mode=brownfield --industry=healthcare --stack=auto \
  --gate=test-first=block
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
| `.specify/templates/overrides/` | Each template that the industry or stack profile overlays, composed. Plus the industry profile's own checklists. |
| `.specify/sdd-speckit.json` | All eight answers, `assistant.targets` and the `harness` block (`configVersion: 3`). Canonical, safe to commit. |
| `.specify/sdd-speckit/` | A pinned copy of the templates, profiles, composer and gate runner, so hooks and CI need no plugin |
| `AGENTS.md` | Agent instructions, in a marked block. Text outside the block is kept. |
| `.github/workflows/sdd-gates.yml` | Runs the gates and the template check on every pull request |
| `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/` | Composed. Replaced on a later run only while unedited. |
| `.github/CODEOWNERS`, `docs/adr/0000-record-architecture-decisions.md` | Written once. An existing file is kept. |
| `.gitignore` | Four local harness state paths, appended |
| `.mcp.json` | Chosen catalog picks plus every custom entry, under `mcpServers`. Read by both assistants. |
| `.vscode/` or `.idea/` | Per `editors/editor-map.json`, with the extension or plugin of every chosen assistant |
| **Claude Code target** | |
| `.claude/sdd-speckit/` | `commands/ agents/ skills/ hooks/ templates/` |
| `CLAUDE.md` | Imports `AGENTS.md`, plus a Claude-only block. Merged like `AGENTS.md`. |
| `.claude/settings.json` | The OTel `env` variables, the permission rules (baseline plus the stack's commands) and the gate hooks. Merged, never clobbered. |
| `scripts/otel-collector/` | Only for `--telemetry=on --otel-exporter=otlp` |
| **GitHub Copilot target** | |
| `.github/skills/`, `.github/agents/`, `.github/hooks/sdd-speckit.json` | Rendered from the Claude Code sources. See [COPILOT.md](COPILOT.md). |
| `.github/copilot-instructions.md` | A marked block, merged. Your own text outside the markers is kept. |
| `.specify/sdd-speckit/` | Written by the Copilot render when Copilot is a target: also the MCP catalog and hook scripts — what `${CLAUDE_PLUGIN_ROOT}` is in Claude Code |

The eight answers live in `.specify/sdd-speckit.json`, not in `.claude/settings.json`, because
`settings.json` has a defined schema and this framework's config is not part of it.

Templates, project files and gate wiring come from one script, `scripts/onboard-project.py`.
Both installers and the `setup` and `onboard` commands run it, so every path gives the same
result. It needs `python3`. Without it the Node installer still finishes, writes the base
templates only, and says what it skipped.

After the installer, run `/sdd-speckit:speckit.onboard` in the project. See
[ONBOARDING-GREENFIELD-BROWNFIELD.md](ONBOARDING-GREENFIELD-BROWNFIELD.md).

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

`/sdd-speckit:speckit.setup` (Copilot: `/sdd-speckit-setup`) asks the same eight questions
in-session, shows the current value for each, and offers keep-or-change. Narrow it with an
argument: `/sdd-speckit:speckit.setup mcp`.

## Related

[Harness](HARNESS.md) · [Templates](TEMPLATES.md) · [MCP connectors](MCP_CONNECTORS.md) · [Onboarding](../ONBOARDING.md) ·
[Model routing](MODEL_ROUTING.md) · [Architecture](ARCHITECTURE.md) · [GitHub Copilot](COPILOT.md)
