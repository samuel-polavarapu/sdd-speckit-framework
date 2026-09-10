#!/usr/bin/env bash
# install.sh — bash fallback for create-sdd-speckit-app.
#
# Asks the same five questions in the same order, accepts the same flags, and writes the same
# files. When Node 18 or newer is present it delegates to the Node installer, which is the
# reference implementation. Otherwise it does the work here with git, curl and python3.
#
#   ./install.sh my-app
#   ./install.sh my-app --yes --stack=python-fastapi --mcp=github,playwright --editor=vscode
#   ./install.sh --help

set -euo pipefail

FRAMEWORK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.1.0"

TARGET="."
YES=0
DRY_RUN=0
NO_SPECKIT=0
TELEMETRY="off"
OTEL_EXPORTER="console"
OTEL_ENDPOINT=""
STACK="custom"
ASSISTANT="claude"
SECONDARY=""
MCP=""
EDITOR_CHOICE="vscode"
MCP_CUSTOM=()
MCP_INPUT=()

usage() {
  cat <<EOF
install.sh $VERSION — bash fallback installer for the SDD Speckit Framework

  ./install.sh [project-directory] [options]

Asks five questions, in this order, before it writes anything:
  1 telemetry   2 tech stack   3 primary assistant   4 MCP connectors   5 code editor

Options (identical to create-sdd-speckit-app)
  --yes                      Non-interactive. Every unset flag takes its documented default.
  --telemetry=<on|off>       Default: off
  --otel-exporter=<console|otlp>
  --otel-endpoint=<url>
  --stack=<id>               $(ls -1 "$FRAMEWORK_ROOT/presets" 2>/dev/null | tr '\n' '|' | sed 's/|$//')|custom
  --assistant=<claude|copilot|cursor|other>
  --secondary-assistants=<a,b>
  --mcp=<ids>                Comma separated. See mcp/catalog.json
  --mcp-custom=<name>:<transport>:<url-or-command>   Repeatable
  --mcp-input=<id>.<field>=<value>                   Repeatable. Required for a tenant-hosted
                             connector such as Rally, which has no default URL.
  --editor=<vscode|cursor|jetbrains|none>
  --dry-run                  Print every action and write nothing
  --no-speckit               Skip \`specify init\`
  --no-node                  Do not delegate to the Node installer
  --help

Docs: docs/INSTALLER.md
EOF
}

NO_NODE=0
for arg in "$@"; do
  case "$arg" in
    --help|-h) usage; exit 0 ;;
    --version) echo "$VERSION"; exit 0 ;;
    --yes) YES=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --no-speckit) NO_SPECKIT=1 ;;
    --no-node) NO_NODE=1 ;;
    --telemetry=*) TELEMETRY="${arg#*=}" ;;
    --otel-exporter=*) OTEL_EXPORTER="${arg#*=}" ;;
    --otel-endpoint=*) OTEL_ENDPOINT="${arg#*=}" ;;
    --stack=*) STACK="${arg#*=}" ;;
    --assistant=*) ASSISTANT="${arg#*=}" ;;
    --secondary-assistants=*) SECONDARY="${arg#*=}" ;;
    --mcp=*) MCP="${arg#*=}" ;;
    --mcp-custom=*) MCP_CUSTOM+=("${arg#*=}") ;;
    --mcp-input=*) MCP_INPUT+=("${arg#*=}") ;;
    --editor=*) EDITOR_CHOICE="${arg#*=}" ;;
    --*) echo "Unknown option: $arg" >&2; echo "Run --help for the flag list." >&2; exit 1 ;;
    *) TARGET="$arg" ;;
  esac
done

# ---------------------------------------------------------------- delegation

node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  local major
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  [ "$major" -ge 18 ] 2>/dev/null
}

if [ "$NO_NODE" -eq 0 ] && node_ok; then
  echo "Node $(node -v) found — delegating to create-sdd-speckit-app (the reference implementation)."
  exec node "$FRAMEWORK_ROOT/installer/create-sdd-speckit-app/bin/cli.js" "$@"
fi

echo "install.sh $VERSION — no usable Node found, running the bash path."
for tool in python3 curl; do
  command -v "$tool" >/dev/null 2>&1 || { echo "Required tool missing: $tool" >&2; exit 1; }
done

# ------------------------------------------------- the five questions, in order

ask_yn() { # prompt default(y|n)
  local prompt="$1" default="$2" reply suffix
  [ "$default" = "y" ] && suffix="(Y/n)" || suffix="(y/N)"
  read -r -p "$prompt $suffix " reply || reply=""
  reply="$(printf '%s' "$reply" | tr '[:upper:]' '[:lower:]')"
  [ -z "$reply" ] && reply="$default"
  [ "$reply" = "y" ] || [ "$reply" = "yes" ]
}

ask_choice() { # varname prompt default option...
  local __var="$1" prompt="$2" default="$3"; shift 3
  local opts=("$@") i reply
  echo ""; echo "$prompt"
  for i in "${!opts[@]}"; do
    local mark=" "; [ "${opts[$i]}" = "$default" ] && mark="*"
    echo "  $mark $((i + 1))) ${opts[$i]}"
  done
  while true; do
    read -r -p "Choose 1-${#opts[@]} [$default]: " reply || reply=""
    [ -z "$reply" ] && { printf -v "$__var" '%s' "$default" 2>/dev/null || eval "$__var=\$default"; return 0; }
    if [ "$reply" -ge 1 ] 2>/dev/null && [ "$reply" -le "${#opts[@]}" ] 2>/dev/null; then
      eval "$__var=\${opts[\$((reply - 1))]}"; return 0
    fi
    echo "  ! Not a listed option."
  done
}

if [ "$YES" -eq 0 ]; then
  echo ""
  echo "create-sdd-speckit-app (bash) — five questions, then it scaffolds."

  # 1 telemetry
  echo ""
  echo "Enable OpenTelemetry usage monitoring for this project?"
  echo "  It records local metrics — sessions, tokens, estimated cost. It sends nothing to Anthropic."
  if ask_yn "Enable it?" "n"; then
    TELEMETRY="on"
    ask_choice OTEL_EXPORTER "Which exporter?" "console" "console" "otlp"
    if [ "$OTEL_EXPORTER" = "otlp" ]; then
      read -r -p "OTLP endpoint [http://localhost:4317]: " OTEL_ENDPOINT || true
      [ -z "$OTEL_ENDPOINT" ] && OTEL_ENDPOINT="http://localhost:4317"
    fi
  else
    TELEMETRY="off"
  fi

  # 2 tech stack
  mapfile -t STACKS < <(ls -1 "$FRAMEWORK_ROOT/presets" 2>/dev/null; echo custom)
  ask_choice STACK "Which tech stack?" "custom" "${STACKS[@]}"

  # 3 primary assistant
  ask_choice ASSISTANT "Primary AI coding assistant?" "claude" "claude" "copilot" "cursor" "other"
  read -r -p "Secondary assistants, comma separated (blank for none): " SECONDARY || true

  # 4 MCP connectors
  echo ""
  echo "Which MCP connectors? (optional)"
  mapfile -t IDS < <(python3 -c "
import json
for c in json.load(open('$FRAMEWORK_ROOT/mcp/catalog.json'))['connectors']:
    print(c['id'])
")
  python3 -c "
import json
for i, c in enumerate(json.load(open('$FRAMEWORK_ROOT/mcp/catalog.json'))['connectors'], 1):
    a = c.get('auth') or {}
    kind = 'no auth' if a.get('kind') == 'none' else ('needs %s up front' % a.get('credentialEnvVar') if a.get('needsUpfrontCredential') else 'OAuth - authorize once with /mcp')
    extra = '; asks for your own URL' if c.get('requiresUserInput') else ''
    print('  %d) %s - %s (%s%s)' % (i, c['displayName'], c['description'], kind, extra))
"
  read -r -p "Numbers, comma separated (blank for none): " picks || picks=""
  MCP=""
  if [ -n "$picks" ]; then
    IFS=',' read -r -a nums <<< "$picks"
    for n in "${nums[@]}"; do
      n="$(printf '%s' "$n" | tr -d '[:space:]')"
      if [ "$n" -ge 1 ] 2>/dev/null && [ "$n" -le "${#IDS[@]}" ] 2>/dev/null; then
        MCP="${MCP:+$MCP,}${IDS[$((n - 1))]}"
      else
        echo "  ! ignoring \"$n\": not a listed option"
      fi
    done
  fi

  # A tenant-hosted connector has no default endpoint. Collect it here.
  IFS=',' read -r -a chosen <<< "${MCP:-}"
  for id in "${chosen[@]:-}"; do
    [ -z "$id" ] && continue
    needs="$(python3 -c "
import json
c = next((x for x in json.load(open('$FRAMEWORK_ROOT/mcp/catalog.json'))['connectors'] if x['id'] == '$id'), None)
print('1' if c and c.get('requiresUserInput') else '0')
")"
    if [ "$needs" = "1" ]; then
      echo ""
      echo "$id is hosted by your own organization, so this framework ships no default URL."
      read -r -p "  $id MCP URL: " u || u=""
      [ -z "$u" ] && { echo "  ! no URL given — dropping $id"; MCP="$(printf '%s' "$MCP" | tr ',' '\n' | grep -v "^$id$" | paste -sd, -)"; continue; }
      read -r -p "  Env var holding the credential [RALLY_API_KEY]: " v || v=""
      [ -z "$v" ] && v="RALLY_API_KEY"
      MCP_INPUT+=("$id.url=$u" "$id.credentialEnvVar=$v")
    fi
  done

  # custom connector loop
  while ask_yn "Add a custom MCP server?" "n"; do
    read -r -p "  Server name: " cid || cid=""
    [ -z "$cid" ] && { echo "  ! name required"; continue; }
    ask_choice ctrans "  Transport" "http" "http" "sse" "stdio"
    if [ "$ctrans" = "stdio" ]; then
      read -r -p "  Command and arguments: " cval || cval=""
    else
      read -r -p "  URL: " cval || cval=""
    fi
    [ -z "$cval" ] && { echo "  ! value required"; continue; }
    MCP_CUSTOM+=("$cid:$ctrans:$cval")
  done

  # 5 editor
  ask_choice EDITOR_CHOICE "Preferred code editor?" "vscode" "vscode" "cursor" "jetbrains" "none"

  echo ""
  echo "Scaffold into $(cd "$(dirname "$TARGET")" 2>/dev/null && pwd || echo "$PWD")/$(basename "$TARGET")?"
  echo "  telemetry=$TELEMETRY stack=$STACK assistant=$ASSISTANT mcp=${MCP:-none} editor=$EDITOR_CHOICE"
  ask_yn "Proceed?" "y" || { echo ""; echo "Nothing written."; exit 0; }
fi

# ---------------------------------------------------------------- validation
# Runs before the first write, so a tenant-hosted connector with no URL fails with nothing
# half-written. The Node installer validates at the same point.

MCP_INPUT_PRECHECK="$(printf '%s\n' "${MCP_INPUT[@]:-}" | paste -sd'|' -)"
if [ -n "${MCP:-}" ]; then
  MCP="$MCP" MCP_INPUT_JOINED="$MCP_INPUT_PRECHECK" FRAMEWORK_ROOT="$FRAMEWORK_ROOT" python3 - <<'EOPY' || exit 1
import json, os, sys

catalog = json.load(open(os.path.join(os.environ["FRAMEWORK_ROOT"], "mcp", "catalog.json")))
by_id = {c["id"]: c for c in catalog["connectors"]}
ids = [s for s in os.environ.get("MCP", "").replace(" ", "").split(",") if s]

supplied = set()
for spec in os.environ.get("MCP_INPUT_JOINED", "").split("|"):
    key, _, value = spec.partition("=")
    cid, _, field = key.partition(".")
    if field == "url" and value:
        supplied.add(cid)

failed = False
for cid in ids:
    c = by_id.get(cid)
    if not c:
        print(f'--mcp="{cid}" is not in the catalog. Choose from: {",".join(by_id)}', file=sys.stderr)
        failed = True
    elif c.get("requiresUserInput") and cid not in supplied:
        print(f"{c['displayName']} is tenant-hosted and has no default URL.", file=sys.stderr)
        print(f"  Supply it: --mcp-input={cid}.url=https://<your-host>/mcp", file=sys.stderr)
        failed = True
sys.exit(1 if failed else 0)
EOPY
fi

# ------------------------------------------------------------------ scaffold
# Every question is answered and validated by this point. Nothing above touched the filesystem.

run() { if [ "$DRY_RUN" -eq 1 ]; then echo "  would: $*"; else "$@"; fi; }

echo ""
[ "$DRY_RUN" -eq 1 ] && echo "Would do (dry run — nothing written)" || echo "Done"

run mkdir -p "$TARGET"

integration="$ASSISTANT"
case "$ASSISTANT" in
  cursor) integration="cursor-agent" ;;
  other) integration="generic" ;;
esac

if [ "$NO_SPECKIT" -eq 0 ] && command -v uvx >/dev/null 2>&1; then
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  would: uvx --from git+https://github.com/github/spec-kit.git specify init --here --force --non-interactive --integration $integration"
  else
    ( cd "$TARGET" && uvx --from git+https://github.com/github/spec-kit.git specify init \
        --here --force --non-interactive --integration "$integration" ) \
      || echo "  - specify init failed — vendored templates used instead"
  fi
else
  echo "  - Speckit init skipped (uvx absent or --no-speckit); vendored templates used"
fi

for d in commands agents skills hooks templates; do
  [ -d "$FRAMEWORK_ROOT/$d" ] || continue
  run mkdir -p "$TARGET/.claude/sdd-speckit"
  if [ "$DRY_RUN" -eq 1 ]; then echo "  would: copy $d/ -> .claude/sdd-speckit/$d/"
  else cp -R "$FRAMEWORK_ROOT/$d" "$TARGET/.claude/sdd-speckit/"; echo "  - copied $d/"; fi
done

if [ -d "$FRAMEWORK_ROOT/presets/$STACK/templates" ]; then
  run mkdir -p "$TARGET/.specify/templates/overrides"
  for f in "$FRAMEWORK_ROOT/presets/$STACK/templates"/*; do
    if [ "$DRY_RUN" -eq 1 ]; then echo "  would: copy $(basename "$f") -> .specify/templates/overrides/"
    else cp "$f" "$TARGET/.specify/templates/overrides/"; echo "  - preset override -> .specify/templates/overrides/$(basename "$f")"; fi
  done
fi

# .mcp.json, .claude/settings.json, .specify/sdd-speckit.json and the editor files all share the
# framework's own JSON metadata, so python3 does the merge rather than a fragile shell rewrite.
CUSTOM_JOINED="$(printf '%s\n' "${MCP_CUSTOM[@]:-}" | paste -sd'|' -)"
INPUT_JOINED="$(printf '%s\n' "${MCP_INPUT[@]:-}" | paste -sd'|' -)"

DRY_RUN="$DRY_RUN" TARGET="$TARGET" FRAMEWORK_ROOT="$FRAMEWORK_ROOT" \
TELEMETRY="$TELEMETRY" OTEL_EXPORTER="$OTEL_EXPORTER" OTEL_ENDPOINT="$OTEL_ENDPOINT" \
STACK="$STACK" ASSISTANT="$ASSISTANT" SECONDARY="$SECONDARY" MCP="$MCP" \
EDITOR_CHOICE="$EDITOR_CHOICE" MCP_CUSTOM_JOINED="$CUSTOM_JOINED" MCP_INPUT_JOINED="$INPUT_JOINED" \
python3 "$FRAMEWORK_ROOT/installer/write-config.py"

cat <<EOF

Register the plugin
  claude plugin marketplace add $FRAMEWORK_ROOT
  claude plugin install sdd-speckit@sdd-speckit-framework
Or, inside an interactive Claude Code session:
  /plugin marketplace add $FRAMEWORK_ROOT
  /plugin install sdd-speckit@sdd-speckit-framework

An OAuth connector needs a one-time /mcp authorization inside Claude Code. Writing .mcp.json
does not complete the login.

Next step
  /sdd-speckit:speckit.constitution
EOF
