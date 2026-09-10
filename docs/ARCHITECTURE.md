# Architecture

How this repo's parts map onto Claude Code primitives, and why each part is the primitive it is.

## The rule that decides the primitive

Claude Code's own guidance: **enforce with a hook, encode knowledge as a skill, delegate as a
subagent.** Every component here follows it.

| Need | Primitive | Why not the others |
|---|---|---|
| A phase the user starts | **command** | A skill is model-invoked. A phase is a deliberate act. |
| Phase work needing its own context and tier | **subagent** | Keeps the main thread clean and pins the model |
| Reference knowledge, loaded on demand | **skill** | A command would have to be remembered and typed |
| A rule that must hold whatever the model decides | **hook** | Instructions are advisory. A hook is deterministic. |

## Component map

| Repo path | Primitive | Count | Role |
|---|---|---|---|
| `commands/speckit.*.md` | Slash commands | 10 | One per Speckit phase, plus `setup` |
| `agents/*.md` | Subagents | 7 | Phase specialists with pinned tiers and tool sets |
| `skills/*/SKILL.md` | Skills | 4 | Workflow reference, RACI lookup, telemetry digest, clarity pass |
| `hooks/hooks.json` | Lifecycle hooks | 4 | Constitution guard, artifact changelog, tier reminder, usage line |
| `templates/*.md` | Data | 8 | Speckit artifact templates |
| `presets/<id>/` | Data | 3 | Stack-specific template overrides |
| `mcp/` | Data | 6 + custom | Connector catalog and `.mcp.json` fragments |
| `editors/` | Data | 3 targets | Editor extension scaffolding |
| `installer/` | Node + bash CLI | 2 paths | The five questions, then scaffolding |
| `scripts/hooks/*.sh` | Shell | 4 | What the hooks actually run |

## Command to subagent routing

```
speckit.constitution  (opus)   → solution-architect  (opus)
speckit.specify       (sonnet) → spec-author         (sonnet)
speckit.clarify       (sonnet) → spec-author + research-scout (sonnet + haiku)
speckit.plan          (opus)   → solution-architect + research-scout
speckit.checklist     (sonnet) → qa-analyst          (opus)
speckit.tasks         (sonnet) → task-planner        (sonnet)
speckit.analyze       (opus)   → qa-analyst          (opus)   [read-only]
speckit.implement     (sonnet) → implementer + code-reviewer  (sonnet + opus)
speckit.converge      (opus)   → qa-analyst + code-reviewer   (opus)
```

Rationale in [MODEL_ROUTING.md](MODEL_ROUTING.md).

## Read-only is enforced, not requested

`speckit.analyze` declares `disallowed-tools: ["Write", "Edit", "NotebookEdit"]`, and
`code-reviewer` and `research-scout` declare `disallowedTools` too. An instruction saying "do not
write" is advisory. Removing the tool is not.

## The constitution guard

`.specify/memory/constitution.md` is governed. A `PreToolUse` hook blocks `Write`, `Edit` and
`NotebookEdit` against that path unless `.specify/.constitution-unlock` exists. The
`/speckit.constitution` command takes the marker, writes, and releases it.

The `PreToolUse` payload carries the tool call, not the user's prompt, so a hook **cannot** tell
which command is running. The marker is what makes the check deterministic. It guards against an
accidental edit from another phase. **It is not a security boundary** — anything that can run
`touch` can lift it.

## Two things named "hooks" — never conflate them

| Name | What | Where | Owner |
|---|---|---|---|
| **Claude Code hooks** | Lifecycle events running shell commands | `hooks/hooks.json` | This repo |
| **Speckit extension hooks** | Extension points for Speckit extensions | `.specify/extensions.yml` | Speckit |

Unrelated mechanisms, unrelated schemas.

## What Speckit owns, and what this repo owns

| Concern | Owner |
|---|---|
| `.specify/` scaffolding, agent integration | **Speckit** (`specify init`) |
| Presets, extensions, bundles | **Speckit** (`specify preset add`, …) |
| Claude Code commands, agents, skills, hooks | **this repo** |
| MCP catalog, editor scaffolding, the installer | **this repo** |

The installer delegates step one to `specify init` rather than reimplementing it, and falls back
to the vendored templates only when `uvx` is absent — and says so in its summary.

## Command namespacing

Plugin commands resolve as `/sdd-speckit:speckit.plan`.

`specify init --integration claude` writes its own copies into `.claude/skills/`, named with a
hyphen (`speckit-plan`, `speckit-analyze`, …) and invoked as `/speckit-plan`. Verified against
Speckit as of 2026-09-10. So the two sets do **not** collide today, and the plugin namespace keeps
that true if Speckit's naming changes.

The two sets are not redundant. Speckit's skills drive its own scripted workflow. This plugin's
commands add Claude-Code-native orchestration on top: a pinned model tier per phase, delegation
to a phase-matched subagent, and preset-aware template resolution.

## Related

[RACI](RACI.md) · [Installer](INSTALLER.md) · [MCP connectors](MCP_CONNECTORS.md) ·
[Workflow reference](../skills/speckit-workflow/SKILL.md)
