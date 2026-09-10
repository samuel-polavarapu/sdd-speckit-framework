# Model routing

Match the model tier to the work. High-stakes reasoning gets the top tier. High-volume
pattern-following does not.

| Phase | Primary work | Tier | Why |
|---|---|---|---|
| Constitution | Governance and non-negotiables | **opus** | High-stakes, low-frequency, must be right |
| Specify / Clarify | Requirements, disambiguation | **sonnet** | Balanced, conversational |
| Plan | Architecture and technical design | **opus** | Complex reasoning, cross-cutting decisions |
| Checklist / Tasks | Structured decomposition | **sonnet** | Pattern-following, high volume |
| Analyze | Cross-artifact consistency | **opus** | Must hold several documents in tension |
| Implement | Code generation | **sonnet** (escalate to opus on a hard bug) | Routine execution most of the time |
| Research / lookups | Getting docs, best-practice scans | **haiku** | Fast, cheap, high volume, low judgment |

## Where the tier is declared

| Mechanism | Where | Effect |
|---|---|---|
| Command frontmatter | `commands/speckit.*.md` → `model:` | The tier for that command's own turn |
| Subagent frontmatter | `agents/*.md` → `model:` | The tier for that delegated subagent |
| `SessionStart` hook | `hooks/hooks.json` | Prints the table. **Advisory text only.** |

## The honest limitation

**No hook can change the active model.** Claude Code has no such mechanism, and this framework
does not pretend otherwise.

- A **command** carries its own `model:`, so `/sdd-speckit:speckit.plan` runs on opus without you
  doing anything.
- A **subagent** carries its own `model:`, so delegated work lands on the right tier.
- Work you drive **by hand**, outside a command, runs on whatever `/model` is set to. The
  `SessionStart` hook reminds you. It cannot act.

If you see a plugin claiming to switch models from a hook, that claim is wrong.

## Escalating mid-implementation

`implementer` runs on sonnet. Its rule: **a bug that survives two focused attempts means stop.**
It reports what it tried and what it observed, and recommends `/model opus`. It does not grind,
and it cannot escalate itself.

## Cost note

Enable telemetry ([installer docs](INSTALLER.md)) and ask for a digest — the `telemetry-report`
skill reports measured token and cost figures per tier, so routing can be checked against real
numbers instead of assumed.

## Related

[RACI](RACI.md) · [Architecture](ARCHITECTURE.md) · [Installer](INSTALLER.md)
