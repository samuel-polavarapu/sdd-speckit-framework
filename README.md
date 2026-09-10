# sdd-speckit-framework

A Spec-Driven Development starter kit for **Claude Code**, packaging GitHub's
[Speckit](https://github.com/github/spec-kit) methodology as an installable plugin plus a
one-command project scaffolder.

You get the Speckit phase workflow, phase-matched subagents on the right model tier, deterministic
guard hooks, a curated MCP connector catalog, and editor scaffolding — wired up by an installer
that asks five questions first.

## Two ways in

### 1. Scaffold a new project

```bash
npx github:your-org/sdd-speckit-framework my-app
cd my-app
```

Answers five questions — telemetry, tech stack, primary assistant, MCP connectors, editor — then
scaffolds. Non-interactive for CI:

```bash
npx create-sdd-speckit-app my-app --yes \
  --stack=python-fastapi --assistant=claude --telemetry=off \
  --mcp=github,playwright --editor=vscode
```

No Node? `./installer/install.sh my-app` asks the same five questions.

### 2. Install into an existing repo

```bash
claude plugin marketplace add your-org/sdd-speckit-framework
claude plugin install sdd-speckit@sdd-speckit-framework
```

Or, inside an interactive session — this form always works:

```
/plugin marketplace add your-org/sdd-speckit-framework
/plugin install sdd-speckit@sdd-speckit-framework
```

Then run `/sdd-speckit:speckit.setup` to answer the same five questions in-session.

For local development, skip the marketplace: `claude --plugin-dir /path/to/this/repo`.

## The workflow

```
constitution → specify → clarify → plan → checklist → tasks → analyze → implement → converge
                 └─ required ─┘      ▲       ▲                  ▲
                                     └───────┴─ optional gates ─┘
```

Only **specify before plan** is strict. `clarify`, `checklist` and `analyze` are quality gates.
`analyze` is **read-only** — its write tools are removed, not merely discouraged.

| Command | Writes | Tier |
|---|---|---|
| `/sdd-speckit:speckit.constitution` | `.specify/memory/constitution.md` | opus |
| `/sdd-speckit:speckit.specify` | `spec.md`, `checklists/requirements.md` | sonnet |
| `/sdd-speckit:speckit.clarify` | resolved markers in `spec.md` | sonnet |
| `/sdd-speckit:speckit.plan` | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` | opus |
| `/sdd-speckit:speckit.checklist` | `checklists/<kind>.md` | sonnet |
| `/sdd-speckit:speckit.tasks` | `tasks.md` | sonnet |
| `/sdd-speckit:speckit.analyze` | **nothing — a report** | opus |
| `/sdd-speckit:speckit.implement` | source code | sonnet |
| `/sdd-speckit:speckit.converge` | appended gap tasks | opus |
| `/sdd-speckit:speckit.setup` | project config | sonnet |

## What is in the box

| Component | Count | What |
|---|---|---|
| Commands | 10 | One per phase, plus `setup` |
| Subagents | 7 | `spec-author`, `solution-architect`, `task-planner`, `qa-analyst`, `implementer`, `code-reviewer`, `research-scout` |
| Skills | 4 | `speckit-workflow`, `raci-lookup`, `telemetry-report`, `asd-ste100` |
| Hooks | 4 | Constitution guard, artifact changelog, tier reminder, usage line |
| Templates | 8 | The full Speckit artifact set |
| Presets | 3 | Node full-stack, Python FastAPI, .NET Aspire |
| MCP connectors | 6 + custom | GitHub, Atlassian, Figma, Playwright, Lucid, Rally |
| Editors | 3 | VS Code, Cursor, JetBrains |

## Directory map

```
sdd-speckit-framework/
├── .claude-plugin/         plugin.json, marketplace.json
├── commands/               10 slash commands, one per phase
├── agents/                 7 subagents, model tier per phase
├── skills/                 workflow reference, RACI lookup, telemetry digest, STE clarity pass
├── hooks/hooks.json        4 deterministic lifecycle hooks
├── templates/              8 Speckit artifact templates
├── presets/                3 stacks, each overriding plan + tasks templates
├── mcp/                    catalog.json, snippets/, custom-template.json
├── editors/                vscode/, jetbrains/, editor-map.json
├── installer/              create-sdd-speckit-app/ (Node) + install.sh (bash)
├── scripts/                hooks/*.sh, otel-collector/
└── docs/                   RACI, ARCHITECTURE, MODEL_ROUTING, INSTALLER, MCP_CONNECTORS
```

## Notable design choices

- **Telemetry is off** until you switch it on. Separate from Anthropic's `DISABLE_TELEMETRY`. See
  [INSTALLER.md](docs/INSTALLER.md).
- **Rally is never defaulted.** It is tenant-hosted, so the installer collects the URL or fails.
  See [MCP_CONNECTORS.md](docs/MCP_CONNECTORS.md).
- **No hook switches models.** Claude Code has no such mechanism. Commands and subagents carry
  their own `model:`. The `SessionStart` hook is advisory text. See
  [MODEL_ROUTING.md](docs/MODEL_ROUTING.md).
- **Speckit is delegated to, not reimplemented.** The installer calls `specify init` and uses
  vendored templates only as a fallback, and says which happened.
- **Commands are namespaced** `/sdd-speckit:speckit.*`. Speckit's own installer currently writes
  hyphenated skills (`/speckit-plan`), so nothing collides today, and the namespace keeps that
  true if the naming changes.

## Docs

| Doc | Read it for |
|---|---|
| [ONBOARDING.md](ONBOARDING.md) | First-week walk-through |
| [docs/INSTALLER.md](docs/INSTALLER.md) | Every flag, both paths, the telemetry distinction |
| [docs/MCP_CONNECTORS.md](docs/MCP_CONNECTORS.md) | The catalog, custom connectors, OAuth completion |
| [docs/RACI.md](docs/RACI.md) | Who owns which phase |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How components map to Claude Code primitives |
| [docs/MODEL_ROUTING.md](docs/MODEL_ROUTING.md) | Tier per phase, and the honest limitation |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## Requirements

| Tool | Needed for |
|---|---|
| Claude Code | everything |
| Node 18+ | the reference installer (bash fallback otherwise) |
| `uv` / `uvx` | delegating to Speckit's own `specify init` |
| Docker | the optional local OTel collector |

## Attribution

Speckit methodology and CLI: [github/spec-kit](https://github.com/github/spec-kit).
The `asd-ste100` skill is adapted from
[danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill) (MIT) — see
`skills/asd-ste100/ATTRIBUTION.md`. It applies **STE principles**. It does not redistribute the
ASD-STE100 dictionary, and its output is not "STE100-certified".

MIT licensed.
