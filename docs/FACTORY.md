# Factory Droid

The framework ships as a native **Factory Droid plugin**. The plugin is rendered from the same
Claude Code sources (`commands/`, `agents/`, `skills/`, hooks) as the Copilot files, so a phase is
edited in one place. Formats were checked against docs.factory.com (plugins, custom droids,
skills, hooks) on 2026-11-13.

## Install

```bash
droid plugin marketplace add your-org/sdd-speckit-framework
droid plugin install sdd-speckit@sdd-speckit-framework --scope project
```

Use `--scope project` to install the plugin for this repository rather than for your user
account. Commit the project's `.factory/` settings so the team shares one setup. Use
`--scope user` to install the plugin for yourself only. Inside a session, `/plugins` lists, installs and updates plugins.

Then run `/sdd-speckit-onboard` in the project.

To scaffold a new or existing project for Droid in one step, use the installer:

```bash
npx create-sdd-speckit-app my-app --assistant=factory
```

It records `factory` as a target, runs `specify init --integration droid` when `uvx` is present,
pins the support files, composes the templates, writes `AGENTS.md` and the CI gates, and prints
the two install commands. It writes no `.claude/` files unless Claude Code is also chosen. The
bash installer (`installer/install.sh --assistant=factory`) does the same.

To pin a version, add `#<tag>` or `@<commit sha>` to the marketplace source. To get a new release,
run `droid plugin marketplace update` and then `droid plugin update`.

### From a local checkout

```bash
droid plugin marketplace add /path/to/sdd-speckit-framework
droid plugin install sdd-speckit@sdd-speckit-framework --scope user
```

## How it is packaged

```
.factory-plugin/marketplace.json      repo root: the catalog Droid reads first
adapters/factory/adapter.json         model, tool and hook-matcher maps
adapters/factory/dist/                the plugin (generated, committed, checked in CI)
├── .factory-plugin/plugin.json
├── skills/sdd-speckit-<phase>/       one per command, plus the shared skills
├── droids/                           one per subagent, plus qa-analyst-readonly
├── hooks/hooks.json                  harness gates and the artifact changelog
└── templates/ profiles/ scripts/ mcp/ editors/ docs/
```

Claude Code reads only `.claude-plugin/`, so the two marketplaces in one repo do not interfere.
The Droid catalog does not point at the repo root, because Droid would otherwise fold the Claude
layout (`agents/`, Claude tool names) into the plugin unchanged.

## How each Claude Code primitive maps

| Claude Code | Factory Droid | Notes |
|---|---|---|
| Command `commands/speckit.plan.md` → `/sdd-speckit:speckit.plan` | Skill `skills/sdd-speckit-plan/SKILL.md` → `/sdd-speckit-plan` | `disable-model-invocation: true`. Phases are skills, not Droid commands, because Droid expands `${DROID_PLUGIN_ROOT}` in `SKILL.md`. Commands cannot scope tools or the model in Droid either. |
| Subagent `agents/solution-architect.md` | Droid `droids/solution-architect.md` | `model` set to `claude-opus-5-5`, `claude-sonnet-5-5` or `claude-haiku-5-5`. `tools` mapped to Droid ids. |
| `disallowed-tools` on `/speckit.analyze` | Droid `qa-analyst-readonly` | It has no `Create`, `Edit` or `ApplyPatch`. |
| Skill `skills/<name>/` | Skill `skills/<name>/` | Same format. `telemetry-report` is left out, because it reads Claude Code telemetry. |
| `hooks/hooks.json` (`Write\|Edit\|…`) | `hooks/hooks.json` (`Create\|Edit\|ApplyPatch`) | The same gate runner and changelog scripts. Exit code 2 blocks. |
| `${CLAUDE_PLUGIN_ROOT}` | `${DROID_PLUGIN_ROOT}` | Rewritten in every rendered Markdown file. |

Tool mapping (`adapters/factory/adapter.json`): `Read`→`Read`,`LS` · `Grep`→`Grep` ·
`Glob`→`Glob` · `Write`→`Create` · `Edit`→`Edit`,`ApplyPatch` · `Bash`→`Execute` ·
`WebFetch`→`FetchUrl` · `WebSearch`→`WebSearch` · `NotebookEdit`→dropped.

## Editing and checking

Edit the sources and never the render. Then run:

```bash
cd installer/create-sdd-speckit-app
npm run render:factory   # rewrite adapters/factory/dist/
npm run check:factory    # CI: exit 1 if dist/ has drifted
```

Text for one assistant only goes in a marked passage. `<!-- factory-only ... -->` is unwrapped for
Droid and dropped for Copilot. `<!-- claude-only:start -->…<!-- claude-only:end -->` and
`<!-- copilot-only ... -->` are dropped for Droid.

## Limits

- **The model tier is a preference.** A droid falls back when its model is not enabled for the
  organisation. Set a tier to `null` in `adapter.json` to write `model: inherit`.
- **`SessionStart` and `SessionEnd` hooks are not shipped.** The tier reminder and the usage line
  are written for Claude Code.
- **Onboarding writes Claude Code and CI wiring** (`CLAUDE.md`, `.claude/settings.json`,
  `sdd-gates.yml`). Under Droid, the plugin's own hooks run the gates. The project CI runs them on
  the pull request. Droid reads the generated `AGENTS.md`.
- **A gate is a guardrail, not a security boundary.** See [HARNESS.md](HARNESS.md).
