# GitHub Copilot

This framework runs on Claude Code and on GitHub Copilot from one set of sources. The Claude Code
files in `commands/`, `agents/` and `skills/` are canonical. An adapter renders the Copilot files
from them, so a phase is edited in one place and cannot drift between the two assistants.

Formats verified against code.visualstudio.com and docs.github.com on 2026-11-13.

## Getting it

| Situation | Command |
|---|---|
| New project, Copilot only | `npx create-sdd-speckit-app my-app --assistant=copilot` |
| New project, both assistants | `npx create-sdd-speckit-app my-app --assistant=both` |
| Existing repo | `npx create-sdd-speckit-app . --emit=copilot` (Copilot files only, no questions) |
| No Node | `./installer/install.sh my-app --assistant=copilot` copies the committed render in `adapters/copilot/dist/` |
| Browse or copy by hand | `adapters/copilot/dist/`. Copy its `.github/` and `.specify/` into your repo. |

There is no plugin to register. Commit `.github/` and `.specify/sdd-speckit/`. The Copilot cloud
agent reads them from the default branch.

## How each Claude Code primitive maps

| Claude Code | GitHub Copilot | Notes |
|---|---|---|
| Slash command `commands/speckit.plan.md` → `/sdd-speckit:speckit.plan` | Skill `.github/skills/sdd-speckit-plan/SKILL.md` → `/sdd-speckit-plan` | `disable-model-invocation: true`. A phase is a deliberate act, so the model does not start one by itself. |
| Subagent `agents/solution-architect.md` | Custom agent `.github/agents/solution-architect.agent.md` | `model` and `tools` carried over through `adapters/copilot/adapter.json`. |
| Skill `skills/<name>/` | Skill `.github/skills/<name>/` | Same Agent Skills format. Paths in the text rewritten. `telemetry-report` is left out, because it reads Claude Code telemetry. |
| Plugin hooks `hooks/hooks.json` | `.github/hooks/sdd-speckit.json` (`version: 1`) | Constitution guard (`preToolUse`) and artifact changelog (`postToolUse`). The same scripts run under both. |
| `${CLAUDE_PLUGIN_ROOT}/templates/` … | `.specify/sdd-speckit/templates/` … | Templates, presets, MCP catalog, editor map, hook scripts, RACI and model-routing docs. |
| `CLAUDE.md` (none shipped) | `.github/copilot-instructions.md` | A marked block with the phase table and the rules. Text outside the markers is yours and is kept on re-render. |
| `.mcp.json` | `.mcp.json` | **The same file.** Copilot reads the workspace-root `.mcp.json` with `mcpServers` and `${VAR}` references. |

Why skills and not `.github/prompts/*.prompt.md`: VS Code runs prompt files only in its Local
harness, which is deprecated and is removed in February 2027. Its docs recommend skills instead.
Skills work in VS Code, the Copilot CLI and the Copilot app.

## Model tiers

A Copilot skill cannot pin a model. A custom agent can. So every phase skill tells Copilot to run
the work in its phase agent as a subagent, and the agent carries the tier:

| Tier | Copilot model (`adapters/copilot/adapter.json` → `models`) |
|---|---|
| opus | `Claude Opus 5.5 (copilot)` |
| sonnet | `Claude Sonnet 5.5 (copilot)` |
| haiku | `Claude Haiku 5.5 (copilot)` |

Copilot treats `model:` as a preference. When the model is not enabled for the account, it falls
back to another model. Set a tier to `null` to leave `model:` out, and Copilot then uses whatever
model the user picked. Re-render after you change the map.

Work in the main chat, outside a custom agent, runs on the model picked in the chat. That is the
same limitation that [MODEL_ROUTING.md](MODEL_ROUTING.md) describes for Claude Code.

## Read-only `analyze`

In Claude Code, `speckit.analyze` removes `Write`, `Edit` and `NotebookEdit` from its own tool
pool. A Copilot skill has no tool list, so the adapter does the following:

- It renders `qa-analyst-readonly.agent.md`, which is `qa-analyst` with those tools removed
  (`tools: ["read", "search", "execute"]`, `user-invocable: false`).
- It routes `/sdd-speckit-analyze` to that agent.
- It tells the main conversation not to edit files.

The analysis itself runs in an agent with no edit tool. The instruction to the main chat is still
advisory.

Any command that declares `disallowed-tools` gets the same treatment automatically.

## The constitution guard

`.github/hooks/sdd-speckit.json` runs `guard-constitution.sh` before every tool call. The hook has
no `matcher`, because Copilot's tool names differ between the CLI (`edit`, `create`), the cloud
agent and VS Code. Instead, the script itself decides when to act:

- **What it ignores.** It looks only at file-writing tools, and only at writes to
  `.specify/memory/constitution.md`. Reads pass. So do writes whose *content* merely mentions that
  path.
- **Payloads.** `_payload.py` reads both payload shapes. Claude Code sends `tool_name`/`tool_input`.
  Copilot sends `toolName`/`toolArgs`, with `toolArgs` as a JSON string or as an object. For an
  `apply_patch` call, the script takes the target paths from the patch headers.
- **How it denies.** It exits with code 2 and prints `{"permissionDecision":"deny", …}`. Both
  assistants treat that as a denial.

The constitution phase takes the unlock marker itself, as it does in Claude Code. The guard
prevents accidents. It is not a security boundary.

The model-tier reminder and the usage line stay Claude Code only. Telemetry is Claude Code only.
The installer says so when Copilot is the only assistant.

## Speckit's own Copilot files

`specify init --integration copilot` writes Speckit's own skills to `.github/skills/speckit-*/`,
invoked as `/speckit-plan` (checked against spec-kit `2ee2b1e`, 2026-11-13). This framework's skills
are `sdd-speckit-*`, so the two sets do not collide. With `--assistant=both`, the installer runs
`specify init` once per integration, and both runs merge into the same `.specify/`.

## MCP and the cloud agent

VS Code and the Copilot CLI read `.mcp.json`. **The Copilot cloud agent does not.** Configure its
servers in the repository's **Settings → Copilot → Coding agent → MCP configuration**, using the
same entries. The installer reminds you when it writes `.mcp.json` for a Copilot target.

## Keeping the render in step

```bash
cd installer/create-sdd-speckit-app
npm run render:copilot   # rewrites adapters/copilot/dist/ from the sources
npm run check:copilot    # exit 1 if dist/ has drifted: run this in CI
```

`--emit=copilot --check <dir>` also works on a project. There it compares the rendered files, and
reports an extra file only inside a path the render owns (`.specify/sdd-speckit/`, the rendered
skill folders). `--strict` reports every extra file, which is what the `dist/` check uses.

### Rules for editing the sources

- Write paths as `${CLAUDE_PLUGIN_ROOT}/...` and phase names as `/sdd-speckit:speckit.*`. The
  adapter rewrites them. A render fails if either string survives.
- Put a passage that is true for only one assistant inside a marker:
  - `<!-- claude-only:start -->` … `<!-- claude-only:end -->` is dropped for Copilot.
  - `<!-- copilot-only` … `-->` is unwrapped for Copilot and is a comment in Claude Code.
- Routing (which command uses which agent) lives in `adapter.json` → `routing`. It mirrors the
  table in [ARCHITECTURE.md](ARCHITECTURE.md).

## Related

[Architecture](ARCHITECTURE.md) · [Installer](INSTALLER.md) · [Model routing](MODEL_ROUTING.md) ·
[MCP connectors](MCP_CONNECTORS.md)
