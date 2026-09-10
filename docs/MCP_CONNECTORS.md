# MCP connectors

Six curated connectors, plus a path for any other MCP server. Endpoints verified **2026-09-10**
against each vendor's own documentation.

**Endpoints drift.** Re-verify before trusting this table. `mcp/catalog.json` carries the same
values in machine-readable form and is what the installer actually reads.

## Catalog

| Connector | Transport | Endpoint / package | Auth | Credential up front? |
|---|---|---|---|---|
| **GitHub** | http | `https://api.githubcopilot.com/mcp/` | OAuth or PAT bearer | no (PAT optional) |
| **Jira / Confluence** | http | `https://mcp.atlassian.com/v2/mcp` | OAuth 2.1 or API token | no |
| **Figma** | http | `https://mcp.figma.com/mcp` | OAuth | no |
| **Playwright** | stdio | `npx @playwright/mcp@latest` | none | no |
| **Lucid** | http | `https://mcp.lucid.app/mcp` | OAuth (dynamic client registration) | no |
| **Rally** | http | **none — tenant-hosted** | API key or OAuth | **yes** |

### Per-connector notes

- **GitHub** — Anthropic also ships an official plugin. Installing via the marketplace, prefer
  `claude plugin install github@claude-plugins-official`. A **GitHub Enterprise Server** tenant
  uses its own host, not the URL above.
- **Atlassian** — Atlassian deprecated the HTTP+SSE endpoint `/v1/sse` with a 30 June 2026 sunset. Use
  `/v2/mcp`. Atlassian Cloud only.
- **Figma** — the official plugin `figma@claude-plugins-official` is the smoother path. A desktop
  server also exists, served by the Figma app with Dev Mode enabled on a local port. Take that URL
  from the app rather than assuming one.
- **Playwright** — local, no credential. It downloads a browser on first use, so the first call is
  slow.
- **Lucid** — a Lucid **account admin must enable MCP access** in the Admin Panel first. Without
  that the OAuth login fails, and the reason is not obvious.
- **Rally** — see below.

## Rally has no public endpoint

Broadcom's Rally MCP is **hosted by each customer in their own Rally workspace**. There is no
single URL, so this framework ships **none**:

- `mcp/catalog.json` has `"url": null` and `"requiresUserInput": true`.
- `mcp/snippets/rally.json` is a **template** with `RALLY_MCP_URL_PLACEHOLDER`.
- Interactively, the installer prompts for the URL and the credential env var.
- Non-interactively it **fails before writing anything** unless you pass
  `--mcp-input=rally.url=...`.
- The installer refuses the placeholder string itself, so a half-filled template cannot reach
  `.mcp.json`.

Ask your platform team for the host and the credential. A Rally admin provisions both.

## Adding a custom connector

Same loop, same result. A custom entry is **indistinguishable from a catalog entry** once written.

| Prompt | Flag equivalent |
|---|---|
| Server name | `--mcp-custom=<name>:…` |
| Transport (`http` \| `sse` \| `stdio`) | `…:<transport>:…` |
| URL, or command and arguments | `…:<url-or-command>` |
| Credential env var (optional) | asked interactively |

```bash
--mcp-custom=acme-tickets:http:https://mcp.acme.example/mcp
--mcp-custom=local-db:stdio:npx -y @acme/db-mcp
```

Answers are validated against `mcp/custom-template.json` — a JSON Schema requiring `url` for
`http`/`sse`, `command` for `stdio`, a lowercase-hyphen id, and `UPPER_SNAKE_CASE` for a
credential variable. The installer rejects a failing entry with the reason and writes nothing.

## Secrets are referenced, never written

`.mcp.json` holds `${VAR}`, not the secret:

```json
{ "mcpServers": { "github": {
  "type": "http",
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": { "Authorization": "Bearer ${GITHUB_PAT}" }
} } }
```

So `.mcp.json` is safe to commit, and the installer lists the variables you must export.

## Writing `.mcp.json` does not finish setup

**Every OAuth connector needs a one-time authorization inside Claude Code.** Open the project and
run:

```
/mcp
```

then authorize each connector. Until then it is configured but not connected. The installer's
summary lists exactly which ones are waiting.

## Project scope, and adding one by hand

The installer writes a project-scoped `.mcp.json`, the shareable, committable scope. By hand:

```bash
claude mcp add --scope project --transport http lucid https://mcp.lucid.app/mcp
claude mcp add --scope project playwright npx @playwright/mcp@latest
claude mcp add --scope project --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer $GITHUB_PAT"
```

`--scope` also takes `local` (just you, this project) and `user` (you, every project).

## Changing the selection later

```
/sdd-speckit:speckit.setup mcp
```

## Related

[Installer](INSTALLER.md) · [Onboarding](../ONBOARDING.md) · [Architecture](ARCHITECTURE.md)
