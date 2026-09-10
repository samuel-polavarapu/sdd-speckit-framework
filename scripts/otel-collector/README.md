# Local OTel collector

Runs only if you opted into telemetry with the `otlp` exporter. With the `console` exporter you
need none of this — metrics print into the session.

## Run it

```bash
docker compose up -d      # start
docker compose logs -f    # watch metrics arrive
docker compose down       # stop
```

## What it does

| Piece | Value |
|---|---|
| Listens on | `localhost:4317` (gRPC), `localhost:4318` (HTTP) |
| Writes to | `./data/metrics.json` |
| Forwards to | nothing — the file exporter is the only sink |

The installer sets `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317` in
`.claude/settings.json`, which matches the gRPC port above.

## Reading the output

Ask Claude for a usage digest and the `telemetry-report` skill reads `./data/metrics.json`. Or
read it directly:

```bash
jq -r '.resourceMetrics[]?.scopeMetrics[]?.metrics[]?.name' data/metrics.json | sort -u
```

## Metrics Claude Code emits

`claude_code.session.count` · `claude_code.token.usage` · `claude_code.cost.usage` ·
`claude_code.lines_of_code.count` · `claude_code.commit.count` · `claude_code.pull_request.count` ·
`claude_code.code_edit_tool.decision`

## Turning it off

```
/sdd-speckit:speckit.setup telemetry
```

That removes the OTel env keys from `.claude/settings.json`. Then `docker compose down`.

## Not the same as DISABLE_TELEMETRY

This collector is **your** local monitoring. Anthropic's own `DISABLE_TELEMETRY` variable is a
separate, unrelated control. See `docs/INSTALLER.md`.

## Do not commit `data/`

It holds usage volume for your project. The scaffolded `.gitignore` excludes it.
