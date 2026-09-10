# Onboarding — your first week

A walk-through: install, answer five questions, finish the MCP logins, then run the whole
`/speckit.*` sequence on one small feature. Budget about two hours for day one.

## Day 1 — install

### 1. Check your tools

```bash
claude --version          # Claude Code
node -v                   # 18+ for the reference installer
uvx --version             # optional, lets the installer delegate to Speckit's own init
```

Missing `uvx`? Install [uv](https://docs.astral.sh/uv/). Without it the installer uses the
vendored templates and tells you so.

### 2. Run the installer

```bash
npx github:your-org/sdd-speckit-framework my-app
cd my-app
```

No Node: `./installer/install.sh my-app`.

### 3. Answer the five questions

| # | Question | Guidance |
|---|---|---|
| 1 | **Telemetry** | Say no on day one. Turn it on later with `/sdd-speckit:speckit.setup telemetry`. |
| 2 | **Tech stack** | Pick the closest preset. It pre-fills the plan and tasks templates. `custom` if none fit. |
| 3 | **Primary assistant** | `Claude Code` unless your team standardized elsewhere. Add secondaries if people differ. |
| 4 | **MCP connectors** | Pick only what you will use this week. Adding more later is one command. |
| 5 | **Editor** | VS Code or JetBrains. Wires the Claude Code extension for every contributor. |

Nothing is written until you confirm. `--dry-run` shows the plan and writes nothing.

### 4. Register the plugin

```bash
claude plugin marketplace add /path/to/sdd-speckit-framework
claude plugin install sdd-speckit@sdd-speckit-framework
```

If those subcommands are unavailable in your version, run the same two inside a session:
`/plugin marketplace add …` then `/plugin install …`. The installer prints whichever form works.

## Day 1 — finish the connector logins

**Writing `.mcp.json` does not log you in.** Open Claude Code in the project:

```
/mcp
```

Authorize each connector the installer listed. Then export any credential variables it named:

```bash
export GITHUB_PAT=ghp_...        # only if you chose the PAT route for GitHub
```

Confirm with `claude mcp list` — each should read **Connected**.

**Rally**, if you chose it: it is tenant-hosted with no public URL. The installer asked for yours.
If you did not have it to hand, get it from your platform team and run
`/sdd-speckit:speckit.setup mcp`.

**Lucid**: a Lucid account admin must enable MCP access before your login can succeed.

## Day 1 — your editor

**VS Code / Cursor** — open the project. Accept the Recommended Extensions prompt. It installs
`anthropic.claude-code` plus your preset's language extensions.

**JetBrains** — open the project. Accept the Required Plugins prompt, which installs
`com.anthropic.code.plugin` ("Claude Code [Beta]"). **The plugin wraps the separately installed
Claude Code CLI — it does not bundle it.** Install the CLI too, or the plugin has nothing to drive.

**Other / none** — nothing was written. If you change your mind, see
[code.claude.com/docs/en/vs-code](https://code.claude.com/docs/en/vs-code) and
[/jetbrains](https://code.claude.com/docs/en/jetbrains).

## Day 2 — the constitution

```
/sdd-speckit:speckit.constitution
```

Write three to five principles your team will actually enforce. Keep gates N1–N4 unless you
reject one out loud. **A principle nobody can fail is not a principle.**

Get it reviewed — the Tech Lead is accountable, see [docs/RACI.md](docs/RACI.md). Then try a
clarity pass:

> Run the asd-ste100 skill over .specify/memory/constitution.md in report mode.

## Day 3 — one toy feature, end to end

Pick something genuinely small. A settings toggle. The point is the workflow, not the feature.

```
/sdd-speckit:speckit.specify Let a user mute notifications for 24 hours
```

Read the `[NEEDS CLARIFICATION]` markers. **This is the phase that pays for itself** — every
marker is a wrong guess you did not make.

```
/sdd-speckit:speckit.clarify        # one closed question at a time
/sdd-speckit:speckit.plan           # refuses to run if an architectural marker is open
/sdd-speckit:speckit.checklist security
/sdd-speckit:speckit.tasks          # tests before implementation, always
/sdd-speckit:speckit.analyze        # read-only. Fix findings with the command it names
/sdd-speckit:speckit.implement
/sdd-speckit:speckit.converge       # spec against what actually shipped
```

Stuck on which command is next, or why one refuses to run? Ask — the `speckit-workflow` skill
answers it, including the recovery table.

## Day 4 — the habits that matter

| Habit | Why |
|---|---|
| Never edit `.specify/memory/constitution.md` by hand | A hook blocks it. Amend through the command so the version bumps and Article V records it. |
| Let `analyze` stay read-only | It has no write tools. Recommendations are for you to run. |
| Escalate, do not grind | Two failed attempts on a bug means `/model opus`, not a third attempt. |
| Ask "which document owns this fact?" | A fact in two places drifts. `speckit-workflow` has the ownership table. |
| Skip a gate on purpose, not by accident | Say which gate and why. |

## Day 5 — optional extras

**Telemetry**

```
/sdd-speckit:speckit.setup telemetry
```

With the `otlp` exporter you also get `scripts/otel-collector/` — `docker compose up -d`. Then
ask for a usage digest and the `telemetry-report` skill reads it. This is **your** monitoring, and
it is unrelated to Anthropic's `DISABLE_TELEMETRY`. See [docs/INSTALLER.md](docs/INSTALLER.md).

**Clarity passes** — run `asd-ste100` over `spec.md`, `tasks.md` and your team docs. Report mode
first. It applies STE principles. The output is **not** "STE100-certified".

**Who signs off what** — ask the `raci-lookup` skill, or read [docs/RACI.md](docs/RACI.md). Copy
that file into your project and edit the role names. The skill prefers your copy.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| A connector shows "Needs authentication" | OAuth not completed | Run `/mcp` and authorize |
| Lucid login fails with no clear reason | MCP not enabled for the account | Ask a Lucid admin |
| `/speckit.plan` refuses to start | An architectural clarification is open | Run `/sdd-speckit:speckit.clarify` |
| `/speckit.tasks` refuses to start | No `plan.md`, or a failing constitution gate | Run `/sdd-speckit:speckit.plan` |
| A constitution edit is blocked | Working as designed | Use `/sdd-speckit:speckit.constitution` |
| Both `/speckit-plan` and `/sdd-speckit:speckit.plan` exist | Speckit's own installer wrote its skills too | Both work. The hyphenated one is Speckit's, the namespaced one is this plugin's. |
| `claude plugin install` — unknown command | Older Claude Code | Use `/plugin install …` in a session |
| `specify init` was skipped | `uvx` absent | Install `uv`, then rerun the command the summary printed |

## Related

[README](README.md) · [Installer](docs/INSTALLER.md) · [MCP connectors](docs/MCP_CONNECTORS.md) ·
[RACI](docs/RACI.md) · [Model routing](docs/MODEL_ROUTING.md) ·
[Architecture](docs/ARCHITECTURE.md)
