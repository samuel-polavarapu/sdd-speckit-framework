# Architecture

How this repo's parts map onto Claude Code primitives, and why each part is the primitive it is.
The same parts are rendered to GitHub Copilot primitives by `installer/create-sdd-speckit-app/src/copilot.js`.
The mapping is in [COPILOT.md](COPILOT.md).

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
| `commands/speckit.*.md` | Slash commands | 15 | One per Speckit phase, plus `setup`, `onboard`, `discover`, `baseline`, `status` and `taskstoissues` |
| `agents/*.md` | Subagents | 8 | Phase specialists with pinned tiers and tool sets |
| `skills/*/SKILL.md` | Skills | 4 | Workflow reference, RACI lookup, telemetry digest, clarity pass |
| `hooks/hooks.json` | Lifecycle hooks | 5 | Harness gates (before and after a write), artifact changelog, tier reminder, usage line |
| `templates/` | Data | 29 | Base templates with slots: phase artifacts, `checklists/`, `project/`, and `manifest.json` |
| `profiles/industries/<id>/` | Data | 4 | Regulatory and domain fragments, and the profile's own checklists |
| `profiles/stacks/<id>/` | Data | 3 | Technology fragments, harness globs and commands, permission rules |
| `scripts/compose-templates.py` | Python | 1 | Joins base, industry, stack and project-local layers. See [TEMPLATES.md](TEMPLATES.md) |
| `scripts/onboard-project.py` | Python | 1 | Pins support files, composes, wires gates and permissions, writes the record |
| `scripts/discover-scan.py` | Python | 1 | Deterministic repository facts for mode detection and discovery |
| `scripts/harness/` | Python + JSON | 1 runner | `gate.py` runs the gates in hooks and CI. `gates.json` defines them. See [HARNESS.md](HARNESS.md) |
| `mcp/` | Data | 6 + custom | Connector catalog and `.mcp.json` fragments |
| `editors/` | Data | 3 targets | Editor extension scaffolding |
| `installer/` | Node + bash CLI | 2 paths | The eight questions, then scaffolding. Both call `onboard-project.py` |
| `scripts/hooks/*.sh` | Shell | 4 | What the other hooks run. `guard-constitution.sh` is now a shim into the gate runner. `_payload.py` reads both the Claude Code and the Copilot hook payload. |
| `adapters/copilot/` | Data + render | 1 + `dist/` | Tier, tool and routing maps for the Copilot render, and the committed render itself |

## Command to subagent routing

```
speckit.onboard       (sonnet) → none: runs scripts/onboard-project.py
speckit.discover      (sonnet) → codebase-cartographer (sonnet)   [changes no source]
speckit.baseline      (opus)   → codebase-cartographer + spec-author + solution-architect
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
`code-reviewer`, `research-scout` and `codebase-cartographer` declare `disallowedTools` too. An instruction saying "do not
write" is advisory. Removing the tool is not.

## The constitution guard

`.specify/memory/constitution.md` is governed. A `PreToolUse` hook blocks `Write`, `Edit` and
`NotebookEdit` against that path unless `.specify/.constitution-unlock` exists. The
`/speckit.constitution` command takes the marker, writes, and releases it.

The `PreToolUse` payload carries the tool call, not the user's prompt, so a hook **cannot** tell
which command is running. The marker is what makes the check deterministic. It guards against an
accidental edit from another phase. **It is not a security boundary** — anything that can run
`touch` can lift it.

## The harness gates

The constitution guard is one of eight gates. One runner, `scripts/harness/gate.py`, checks all of
them in two places: in the assistant's hooks before and after a write, and in CI against the pull
request diff. `scripts/harness/gates.json` is the single definition, and the installer, the
onboarding script and the runner all read it.

Each gate is `off`, `warn` or `block` in `.specify/sdd-speckit.json`. A greenfield project starts
at `block`. A brownfield project starts the process gates at `warn` and moves them to `block` one
at a time, on the conditions in its adoption roadmap.

The gates need the **active feature**, which a hook payload does not carry. The phase commands
write it to `.specify/.active-spec`. A branch named `NNN-slug` also resolves it. There is no
"newest spec" fallback, because that would pass every edit.

A project gets a pinned copy of the runner, the templates and the profiles in
`.specify/sdd-speckit/`. CI and the hooks then run the same version with no plugin installed.
Details: [HARNESS.md](HARNESS.md).

## Layered templates

A base template carries named slots. An industry profile and a stack profile are sets of
fragments that fill slots. `scripts/compose-templates.py` joins base → industry → stack →
project-local fragments and writes the result to `.specify/templates/overrides/`, but only for a
template that some layer changed. An untouched template keeps resolving from the framework, so an
upgrade still reaches it. Every phase command reads the override first. Details:
[TEMPLATES.md](TEMPLATES.md).

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
| Industry and stack profiles, the composer, `.specify/templates/overrides/` | **this repo** |
| Harness gates, `.specify/sdd-speckit/`, `.github/workflows/sdd-gates.yml` | **this repo** |
| GitHub Copilot skills, custom agents, hooks, instructions (rendered) | **this repo** |
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
to a phase-matched subagent, profile-aware template resolution, and the harness gates.

## Related

[Harness](HARNESS.md) · [Templates](TEMPLATES.md) · [Industry profiles](INDUSTRY_PROFILES.md) ·
[Greenfield and brownfield onboarding](ONBOARDING-GREENFIELD-BROWNFIELD.md) ·
[RACI](RACI.md) · [Installer](INSTALLER.md) · [MCP connectors](MCP_CONNECTORS.md) ·
[Workflow reference](../skills/speckit-workflow/SKILL.md)
