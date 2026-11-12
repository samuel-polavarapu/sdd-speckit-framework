# sdd-speckit-framework

A Spec-Driven Development starter kit for **Claude Code** and **GitHub Copilot**, packaging
GitHub's [Speckit](https://github.com/github/spec-kit) methodology as a Claude Code plugin, a set
of Copilot skills, custom agents and hooks, and a one-command project scaffolder.

Pick one assistant or both. The Claude Code sources are canonical. The Copilot files are rendered
from them, so each phase is written once. See [docs/COPILOT.md](docs/COPILOT.md).

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

`--assistant` takes `claude`, `copilot`, `both`, `cursor` or `other`.

No Node? `./installer/install.sh my-app` asks the same five questions.

### 2. Install into an existing repo — Claude Code

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

### 3. Install into an existing repo — GitHub Copilot

```bash
npx create-sdd-speckit-app . --emit=copilot
```

This writes `.github/skills/`, `.github/agents/`, `.github/hooks/sdd-speckit.json`, a marked block
in `.github/copilot-instructions.md`, and `.specify/sdd-speckit/`. Commit them. There is nothing
to register. With no Node, copy `adapters/copilot/dist/` into the repo.

## The workflow

```
constitution → specify → clarify → plan → checklist → tasks → analyze → implement → converge
                 └─ required ─┘      ▲       ▲                  ▲
                                     └───────┴─ optional gates ─┘
```

Only **specify before plan** is strict. `clarify`, `checklist` and `analyze` are quality gates.
`analyze` is **read-only** — its write tools are removed, not merely discouraged.

| Claude Code | GitHub Copilot | Writes | Tier |
|---|---|---|---|
| `/sdd-speckit:speckit.constitution` | `/sdd-speckit-constitution` | `.specify/memory/constitution.md` | opus |
| `/sdd-speckit:speckit.specify` | `/sdd-speckit-specify` | `spec.md`, `checklists/requirements.md` | sonnet |
| `/sdd-speckit:speckit.clarify` | `/sdd-speckit-clarify` | resolved markers in `spec.md` | sonnet |
| `/sdd-speckit:speckit.plan` | `/sdd-speckit-plan` | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` | opus |
| `/sdd-speckit:speckit.checklist` | `/sdd-speckit-checklist` | `checklists/<kind>.md` | sonnet |
| `/sdd-speckit:speckit.tasks` | `/sdd-speckit-tasks` | `tasks.md` | sonnet |
| `/sdd-speckit:speckit.analyze` | `/sdd-speckit-analyze` | **nothing — a report** | opus |
| `/sdd-speckit:speckit.implement` | `/sdd-speckit-implement` | source code | sonnet |
| `/sdd-speckit:speckit.converge` | `/sdd-speckit-converge` | appended gap tasks | opus |
| `/sdd-speckit:speckit.setup` | `/sdd-speckit-setup` | project config | sonnet |

In Claude Code, a phase is a slash command with its own model tier. In Copilot, it is a skill that
runs the work in a phase-matched custom agent, and that agent pins the tier and the tool set.

## What is in the box

| Component | Count | What |
|---|---|---|
| Commands | 10 | One per phase, plus `setup`. Copilot: phase skills `sdd-speckit-*` |
| Subagents | 7 | `spec-author`, `solution-architect`, `task-planner`, `qa-analyst`, `implementer`, `code-reviewer`, `research-scout`. Copilot: custom agents, plus `qa-analyst-readonly` |
| Skills | 4 | `speckit-workflow`, `raci-lookup`, `telemetry-report`, `asd-ste100` |
| Hooks | 4 | Constitution guard, artifact changelog, tier reminder, usage line. Copilot: the guard and the changelog |
| Templates | 8 | The full Speckit artifact set |
| Presets | 3 | Node full-stack, Python FastAPI, .NET Aspire |
| MCP connectors | 6 + custom | GitHub, Atlassian, Figma, Playwright, Lucid, Rally |
| Editors | 3 | VS Code, Cursor, JetBrains — recommending each chosen assistant's extension or plugin |
| Assistants | 2 | Claude Code (plugin), GitHub Copilot (rendered `.github/` files) |

## Directory map

```
sdd-speckit-framework/
├── .claude-plugin/         plugin.json, marketplace.json
├── adapters/copilot/       adapter.json (tier, tool, routing maps) + dist/ (committed Copilot render)
├── commands/               10 slash commands, one per phase
├── agents/                 7 subagents, model tier per phase
├── skills/                 workflow reference, RACI lookup, telemetry digest, STE clarity pass
├── hooks/hooks.json        4 deterministic lifecycle hooks
├── templates/              8 Speckit artifact templates
├── presets/                3 stacks, each overriding plan + tasks templates
├── mcp/                    catalog.json, snippets/, custom-template.json
├── editors/                vscode/, jetbrains/, editor-map.json
├── installer/              create-sdd-speckit-app/ (Node, incl. the Copilot renderer) + install.sh (bash)
├── scripts/                hooks/*.sh, otel-collector/
└── docs/                   RACI, ARCHITECTURE, MODEL_ROUTING, INSTALLER, MCP_CONNECTORS, COPILOT
```

## Notable design choices

- **Telemetry is off** until you switch it on. Separate from Anthropic's `DISABLE_TELEMETRY`. See
  [INSTALLER.md](docs/INSTALLER.md).
- **Rally is never defaulted.** It is tenant-hosted, so the installer collects the URL or fails.
  See [MCP_CONNECTORS.md](docs/MCP_CONNECTORS.md).
- **One source, two assistants.** The Copilot files are generated from the Claude Code sources,
  and `npm run check:copilot` fails when the committed render drifts. See
  [COPILOT.md](docs/COPILOT.md).
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
| [docs/COPILOT.md](docs/COPILOT.md) | How the same framework runs on GitHub Copilot, and its limits |
| [docs/MODEL_ROUTING.md](docs/MODEL_ROUTING.md) | Tier per phase, and the honest limitation |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## Requirements

| Tool | Needed for |
|---|---|
| Claude Code and/or GitHub Copilot | everything (Copilot: VS Code Copilot Chat, the Copilot CLI or the cloud agent) |
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
