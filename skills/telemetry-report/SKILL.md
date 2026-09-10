---
name: telemetry-report
description: "Summarize local Claude Code OpenTelemetry output into a short usage digest — sessions, tokens, cost, tool calls. Use when someone asks about this project's Claude Code usage, token spend, telemetry output, or whether monitoring is even switched on."
---

# Telemetry report

Turn local OpenTelemetry output into a digest. Read only what is on this machine.

## First — is telemetry even on?

Check `.claude/settings.json` for `env.CLAUDE_CODE_ENABLE_TELEMETRY`.

**When it is absent or `"0"`, stop and say so.** Telemetry is off by default in this framework, and
that is the intended state, not a misconfiguration. Tell the user how to switch it on
(`/sdd-speckit:speckit.setup telemetry`) and stop there. Do not estimate, model, or reconstruct
usage from anything else — an invented number is worse than no number.

## Where the data is

| Exporter | `env.OTEL_METRICS_EXPORTER` | Where output goes |
|---|---|---|
| Console | `console` | Session stderr, or wherever the session log was redirected |
| OTLP | `otlp` | The collector at `env.OTEL_EXPORTER_OTLP_ENDPOINT` |

With the local collector from `scripts/otel-collector/`, the file exporter writes under
`scripts/otel-collector/data/`. With a remote endpoint, say plainly that you cannot read it from
here, and name the endpoint so the user knows where to look.

## Metrics to report, when present

| Metric | Read as |
|---|---|
| `claude_code.session.count` | Sessions started |
| `claude_code.token.usage` | Tokens, split by `type` — input, output, cacheRead, cacheCreation |
| `claude_code.cost.usage` | Estimated cost in USD |
| `claude_code.lines_of_code.count` | Lines added and removed |
| `claude_code.commit.count`, `claude_code.pull_request.count` | Commits and PRs |
| `claude_code.code_edit_tool.decision` | Edit tool accepted against rejected |

## Digest shape

```
## Claude Code usage — <period>   (exporter: <console|otlp>)

| Metric | Value |
| Sessions | n |
| Input tokens | n |
| Output tokens | n |
| Cache read tokens | n |
| Estimated cost | $n.nn |

Top tools: <tool> (n), <tool> (n)
Coverage: <first timestamp> to <last timestamp>
```

## Rules

- **Report only metrics you actually found.** Omit a row rather than printing a zero — an absent
  metric and a measured zero are different claims.
- **State the coverage window.** A digest over four hours reads very differently from one over a
  month.
- **Call the cost estimated.** It is computed from a rate table, and it is not a bill.
- **Aggregate only.** No prompts, no file paths, no repo or branch names in the digest.

## Related

`docs/INSTALLER.md` explains how this opt-in differs from Anthropic's own `DISABLE_TELEMETRY`
switch. The two are unrelated controls; do not conflate them when answering.
