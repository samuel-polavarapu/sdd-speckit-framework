#!/usr/bin/env python3
"""
Writes .mcp.json, .claude/settings.json, .specify/sdd-speckit.json and the editor files for
install.sh. It exists so the bash path shares the framework's own JSON metadata instead of
rewriting JSON with sed.

The Node installer (installer/create-sdd-speckit-app) is the reference implementation. Keep this
in step with src/scaffold.js.

Every value arrives through the environment, so nothing here parses flags.
"""
import json
import os
import shutil
import sys
from pathlib import Path

DRY = os.environ.get("DRY_RUN") == "1"
TARGET = Path(os.environ["TARGET"])
ROOT = Path(os.environ["FRAMEWORK_ROOT"])

TELEMETRY = os.environ.get("TELEMETRY", "off") == "on"
EXPORTER = os.environ.get("OTEL_EXPORTER", "console")
ENDPOINT = os.environ.get("OTEL_ENDPOINT", "")
STACK = os.environ.get("STACK", "custom")
ASSISTANT = os.environ.get("ASSISTANT", "claude")
SECONDARY = [s for s in os.environ.get("SECONDARY", "").replace(" ", "").split(",") if s]
MCP_IDS = [s for s in os.environ.get("MCP", "").replace(" ", "").split(",") if s]
EDITOR = os.environ.get("EDITOR_CHOICE", "vscode")

INTEGRATION = {"claude": "claude", "copilot": "copilot", "cursor": "cursor-agent"}.get(ASSISTANT, "generic")
RALLY_PLACEHOLDER = "RALLY_MCP_URL_PLACEHOLDER"


def split_joined(name):
    raw = os.environ.get(name, "")
    return [s for s in raw.split("|") if s.strip()]


def parse_custom(spec):
    first = spec.find(":")
    second = spec.find(":", first + 1)
    if first == -1 or second == -1:
        raise SystemExit(f'--mcp-custom="{spec}" must be <name>:<transport>:<url-or-command>')
    entry = {"id": spec[:first], "transport": spec[first + 1 : second]}
    rest = spec[second + 1 :]
    if entry["transport"] == "stdio":
        parts = rest.split()
        entry["command"], entry["args"] = parts[0], parts[1:]
    else:
        entry["url"] = rest
    return entry


def parse_inputs():
    out = {}
    for spec in split_joined("MCP_INPUT_JOINED"):
        key, _, value = spec.partition("=")
        cid, _, field = key.partition(".")
        if not (cid and field and value):
            raise SystemExit(f'--mcp-input="{spec}" must be <connector>.<field>=<value>')
        out.setdefault(cid, {})[field] = value
    return out


def read_json(path, fallback):
    try:
        return json.loads(path.read_text())
    except Exception:
        return fallback


def write_json(path, data, label):
    if DRY:
        print(f"  would: write {label}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n")
    print(f"  - wrote {label}")


CUSTOM = [parse_custom(s) for s in split_joined("MCP_CUSTOM_JOINED")]
INPUTS = parse_inputs()
CATALOG = read_json(ROOT / "mcp" / "catalog.json", {"connectors": []})
BY_ID = {c["id"]: c for c in CATALOG["connectors"]}

# ------------------------------------------------------------------ .mcp.json

servers = dict(read_json(TARGET / ".mcp.json", {}).get("mcpServers", {}))

for cid in MCP_IDS:
    snippet = ROOT / "mcp" / "snippets" / f"{cid}.json"
    if not snippet.exists():
        print(f"  ! no snippet for {cid} — skipped", file=sys.stderr)
        continue
    frag = read_json(snippet, {})
    frag.pop("$comment", None)
    entry = frag.get("mcpServers", {}).get(cid)
    if entry is None:
        print(f"  ! snippet for {cid} has no {cid} entry — skipped", file=sys.stderr)
        continue

    connector = BY_ID.get(cid, {})
    if connector.get("requiresUserInput"):
        url = INPUTS.get(cid, {}).get("url")
        if not url or url == RALLY_PLACEHOLDER:
            raise SystemExit(
                f"{connector.get('displayName', cid)} is tenant-hosted and has no default URL.\n"
                f"  Supply it: --mcp-input={cid}.url=https://<your-host>/mcp"
            )
        entry["url"] = url
        env_var = INPUTS.get(cid, {}).get("credentialEnvVar") or (connector.get("auth") or {}).get("credentialEnvVar")
        if env_var and "Authorization" in entry.get("headers", {}):
            entry["headers"]["Authorization"] = f"Bearer ${{{env_var}}}"

    servers[cid] = entry
    print(f"  - mcp: {cid} (catalog)")

for c in CUSTOM:
    if c["transport"] == "stdio":
        s = {"type": "stdio", "command": c["command"]}
        if c.get("args"):
            s["args"] = c["args"]
    else:
        s = {"type": c["transport"], "url": c["url"]}
        if c.get("credentialEnvVar"):
            s["headers"] = {"Authorization": f"Bearer ${{{c['credentialEnvVar']}}}"}
    servers[c["id"]] = s
    print(f"  - mcp: {c['id']} (custom, {c['transport']})")

if servers:
    existing = read_json(TARGET / ".mcp.json", {})
    existing["mcpServers"] = servers
    write_json(TARGET / ".mcp.json", existing, f".mcp.json ({len(servers)} servers)")
else:
    print("  - no MCP connectors selected — .mcp.json not written")

# ------------------------------------------------------ .claude/settings.json

settings_path = TARGET / ".claude" / "settings.json"
settings = read_json(settings_path, {})
env = dict(settings.get("env", {}))

OTEL_KEYS = [
    "CLAUDE_CODE_ENABLE_TELEMETRY",
    "OTEL_METRICS_EXPORTER",
    "OTEL_EXPORTER_OTLP_ENDPOINT",
    "OTEL_EXPORTER_OTLP_PROTOCOL",
]

if TELEMETRY:
    env["CLAUDE_CODE_ENABLE_TELEMETRY"] = "1"
    env["OTEL_METRICS_EXPORTER"] = EXPORTER
    if EXPORTER == "otlp":
        env["OTEL_EXPORTER_OTLP_ENDPOINT"] = ENDPOINT
        env["OTEL_EXPORTER_OTLP_PROTOCOL"] = "grpc"
    print(f"  - telemetry on ({EXPORTER}{' -> ' + ENDPOINT if ENDPOINT else ''})")
else:
    # Removed, not set to "0" — an explicit 0 reads as opting out of something that was on.
    for k in OTEL_KEYS:
        env.pop(k, None)
    print("  - telemetry off — no OTel env written")

if env:
    settings["env"] = env
else:
    settings.pop("env", None)
write_json(settings_path, settings, ".claude/settings.json")

if TELEMETRY and EXPORTER == "otlp":
    src = ROOT / "scripts" / "otel-collector"
    if src.exists():
        if DRY:
            print("  would: copy scripts/otel-collector/")
        else:
            shutil.copytree(src, TARGET / "scripts" / "otel-collector", dirs_exist_ok=True)
            print("  - copied scripts/otel-collector/")

# -------------------------------------------------------------- editor files

emap = read_json(ROOT / "editors" / "editor-map.json", {"editors": {}, "aliases": {}})
key = emap.get("aliases", {}).get(EDITOR, EDITOR)
entry = emap.get("editors", {}).get(key)

if not entry:
    print(f"  - editor \"{EDITOR}\" is not in editor-map.json — nothing written")
elif not entry.get("copy"):
    print(f"  - editor \"{entry.get('label', key)}\" — nothing to write (see ONBOARDING.md)")
else:
    extras = []
    if entry.get("mergesPresetExtensions"):
        extras = read_json(ROOT / "presets" / STACK / "vscode-extensions.json", {}).get("recommendations", [])

    for c in entry["copy"]:
        src = ROOT / c["from"]
        dst = TARGET / c["to"]
        if not src.exists():
            print(f"  ! missing source {c['from']} — skipped", file=sys.stderr)
            continue
        strategy = c.get("mergeStrategy")
        if strategy == "merge-recommendations":
            base = read_json(src, {})
            cur = read_json(dst, {})
            merged = {**cur, **base}
            seen, recs = set(), []
            for r in list(cur.get("recommendations", [])) + list(base.get("recommendations", [])) + extras:
                if r not in seen:
                    seen.add(r)
                    recs.append(r)
            merged["recommendations"] = recs
            write_json(dst, merged, f"{c['to']} ({len(recs)} recommendations)")
        elif strategy == "merge-shallow":
            write_json(dst, {**read_json(dst, {}), **read_json(src, {})}, c["to"])
        else:
            if DRY:
                print(f"  would: copy {c['from']} -> {c['to']}")
            else:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(src, dst)
                print(f"  - wrote {c['to']}")

    if entry.get("pluginId"):
        print(f"  - JetBrains plugin required: {entry['pluginId']}")

# ------------------------------------------------------- config record

write_json(
    TARGET / ".specify" / "sdd-speckit.json",
    {
        "configVersion": 1,
        "generatedBy": "install.sh",
        "telemetry": {"enabled": TELEMETRY, "exporter": EXPORTER, "endpoint": ENDPOINT},
        "stack": STACK,
        "assistant": {"primary": ASSISTANT, "secondary": SECONDARY, "speckitIntegration": INTEGRATION},
        "mcp": {"catalog": MCP_IDS, "custom": CUSTOM},
        "editor": EDITOR,
    },
    ".specify/sdd-speckit.json",
)

pending = [BY_ID[i]["displayName"] for i in MCP_IDS if (BY_ID.get(i, {}).get("auth") or {}).get("kind") != "none"]
if pending:
    print("\nStill to authorize — writing .mcp.json does not complete an OAuth login:")
    for name in pending:
        print(f"    - {name}")
