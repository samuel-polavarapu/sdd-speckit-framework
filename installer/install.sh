#!/usr/bin/env bash
# install.sh — bash fallback for create-sdd-speckit-app.
#
# Asks the same eight questions in the same order, accepts the same flags, and writes the same
# files. When Node 18 or newer is present it delegates to the Node installer, which is the
# reference implementation. Otherwise it does the work here with git, curl and python3.
#
#   ./install.sh my-app
#   ./install.sh my-app --yes --stack=python-fastapi --mcp=github,playwright --editor=vscode
#   ./install.sh . --yes --mode=brownfield --industry=healthcare --stack=dotnet-aspire
#   ./install.sh --help

set -euo pipefail

FRAMEWORK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.3.0"

TARGET="."
YES=0
DRY_RUN=0
NO_SPECKIT=0
# Empty means "not given". A previous run's answer, then the default, fills it in below.
TELEMETRY=""
OTEL_EXPORTER=""
OTEL_ENDPOINT=""
MODE=""
INDUSTRY=""
STACK=""
ASSISTANT=""
SECONDARY=""
MCP=""
EDITOR_CHOICE=""
GATES=""
GATE=()
MCP_CUSTOM=()
MCP_INPUT=()

profile_ids() { # industries|stacks
  local d
  for d in "$FRAMEWORK_ROOT/profiles/$1"/*/; do
    [ -f "${d}profile.json" ] && basename "$d"
  done
  return 0
}
GATE_IDS="$(python3 -c "
import json
print(' '.join(g['id'] for g in json.load(open('$FRAMEWORK_ROOT/scripts/harness/gates.json'))['gates']))
" 2>/dev/null || true)"

usage() {
  cat <<EOF
install.sh $VERSION — bash fallback installer for the SDD Speckit Framework

  ./install.sh [project-directory] [options]

Asks eight questions, in this order, before it writes anything:
  1 telemetry   2 project mode   3 industry   4 tech stack   5 primary assistant
  6 MCP connectors   7 code editor   8 harness gates

Run it again in the same directory to change an answer. An answer you do not give again is kept.

Options (identical to create-sdd-speckit-app)
  --yes                      Non-interactive. Every unset flag takes its documented default.
  --telemetry=<on|off>       Default: off
  --otel-exporter=<console|otlp>
  --otel-endpoint=<url>
  --mode=<greenfield|brownfield|auto>   Default: auto (brownfield when the directory holds code)
  --industry=<id>            none|$(profile_ids industries | tr '\n' '|' | sed 's/|$//')   Default: none
  --stack=<id>               custom|auto|$(profile_ids stacks | tr '\n' '|' | sed 's/|$//')   Default: custom
  --assistant=<claude|copilot|factory|both|cursor|other>
                             both = Claude Code and GitHub Copilot
                             factory = Factory Droid (installs the plugin in .factory-plugin/)
  --secondary-assistants=<a,b>
  --mcp=<ids>                Comma separated. See mcp/catalog.json
  --mcp-custom=<name>:<transport>:<url-or-command>   Repeatable
  --mcp-input=<id>.<field>=<value>                   Repeatable. Required for a tenant-hosted
                             connector such as Rally, which has no default URL.
  --editor=<vscode|cursor|jetbrains|none>
  --gates=<default|off|warn|block>   All gates at once. Default: the defaults for the mode
                             (greenfield: all block; brownfield: warn, except the constitution
                             guard and the secrets scan, which block)
  --gate=<id>=<off|warn|block>       One gate. Repeatable. Ids: $GATE_IDS
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
    --mode=*) MODE="${arg#*=}" ;;
    --industry=*) INDUSTRY="${arg#*=}" ;;
    --stack=*) STACK="${arg#*=}" ;;
    --gates=*) GATES="${arg#*=}" ;;
    --gate=*) GATE+=("${arg#*=}") ;;
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

# ------------------------------------------------------- earlier answers
# A flag wins over the record a previous run left. The record wins over the defaults.

RECORD="$TARGET/.specify/sdd-speckit.json"
HAVE_RECORD=0
EX_TELEMETRY=""; EX_OTEL_EXPORTER=""; EX_OTEL_ENDPOINT=""; EX_MODE=""; EX_INDUSTRY=""; EX_STACK=""
EX_ASSISTANT=""; EX_SECONDARY=""; EX_EDITOR=""
if [ -f "$RECORD" ]; then
  HAVE_RECORD=1
  eval "$(python3 - "$RECORD" <<'EOPY'
import json, shlex, sys
try:
    r = json.load(open(sys.argv[1]))
except Exception:
    r = {}
t, a = r.get("telemetry") or {}, r.get("assistant") or {}
out = {
    "EX_TELEMETRY": ("on" if t.get("enabled") else "off") if "enabled" in t else "",
    "EX_OTEL_EXPORTER": t.get("exporter"), "EX_OTEL_ENDPOINT": t.get("endpoint"),
    "EX_MODE": r.get("mode"), "EX_INDUSTRY": r.get("industry"), "EX_STACK": r.get("stack"),
    "EX_ASSISTANT": a.get("primary"), "EX_SECONDARY": ",".join(a.get("secondary") or []),
    "EX_EDITOR": r.get("editor"),
}
for k, v in out.items():
    print("%s=%s" % (k, shlex.quote(str(v or ""))))
EOPY
)"
fi

if [ -z "$TELEMETRY" ]; then
  TELEMETRY="${EX_TELEMETRY:-off}"
  [ -z "$OTEL_EXPORTER" ] && OTEL_EXPORTER="$EX_OTEL_EXPORTER"
  [ -z "$OTEL_ENDPOINT" ] && OTEL_ENDPOINT="$EX_OTEL_ENDPOINT"
fi
[ -z "$TELEMETRY" ] && TELEMETRY="off"
if [ -z "$OTEL_EXPORTER" ]; then
  if [ -n "$OTEL_ENDPOINT" ]; then OTEL_EXPORTER="otlp"; else OTEL_EXPORTER="console"; fi
fi
[ -z "$INDUSTRY" ] && INDUSTRY="${EX_INDUSTRY:-none}"
[ -z "$STACK" ] && STACK="${EX_STACK:-custom}"
if [ -z "$ASSISTANT" ]; then
  ASSISTANT="${EX_ASSISTANT:-claude}"
  [ -z "$SECONDARY" ] && SECONDARY="$EX_SECONDARY"
fi
[ -z "$EDITOR_CHOICE" ] && EDITOR_CHOICE="${EX_EDITOR:-vscode}"
# A directory with no record takes the scan's answer. A record from before 0.3.0 has no mode: it
# keeps its old behaviour (the constitution guard only) until --mode is given.
[ -z "$MODE" ] && [ "$HAVE_RECORD" -eq 0 ] && MODE="auto"

scan_brief() { # field
  [ -d "$TARGET" ] || { echo ""; return 0; }
  python3 "$FRAMEWORK_ROOT/scripts/discover-scan.py" "$TARGET" --brief 2>/dev/null | python3 -c "
import json, sys
try:
    print(json.load(sys.stdin).get('$1') or '')
except Exception:
    print('')
"
}

# ------------------------------------------------ the eight questions, in order

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
  echo "create-sdd-speckit-app (bash) — eight questions, then it scaffolds."

  # 1 telemetry
  echo ""
  echo "Enable OpenTelemetry usage monitoring for this project?"
  echo "  It records local metrics — sessions, tokens, estimated cost. It sends nothing to Anthropic."
  tdef="n"; [ "$TELEMETRY" = "on" ] && tdef="y"
  if ask_yn "Enable it?" "$tdef"; then
    TELEMETRY="on"
    ask_choice OTEL_EXPORTER "Which exporter?" "$OTEL_EXPORTER" "console" "otlp"
    if [ "$OTEL_EXPORTER" = "otlp" ]; then
      read -r -p "OTLP endpoint [http://localhost:4317]: " OTEL_ENDPOINT || true
      [ -z "$OTEL_ENDPOINT" ] && OTEL_ENDPOINT="http://localhost:4317"
    fi
  else
    TELEMETRY="off"
  fi

  # 2 project mode
  mdef="${EX_MODE:-$(scan_brief mode)}"; [ -z "$mdef" ] && mdef="greenfield"
  [ "$MODE" = "greenfield" ] || [ "$MODE" = "brownfield" ] && mdef="$MODE"
  echo ""
  echo "Is this a new project or an existing codebase?"
  echo "  greenfield: gates start at block. brownfield: gates start at warn, and discovery,"
  echo "  a derived constitution and baseline specs come first."
  ask_choice MODE "Project mode?" "$mdef" "greenfield" "brownfield"

  # 3 industry
  INDUSTRIES=(none); while IFS= read -r line; do [ -n "$line" ] && INDUSTRIES+=("$line"); done < <(profile_ids industries)
  ask_choice INDUSTRY "Which industry or domain? It adds that domain's standards to the templates." "$INDUSTRY" "${INDUSTRIES[@]}"

  # 4 tech stack
  STACKS=(); while IFS= read -r line; do [ -n "$line" ] && STACKS+=("$line"); done < <(profile_ids stacks)
  STACKS+=(custom)
  sdef="$STACK"
  if [ "$sdef" = "custom" ] || [ "$sdef" = "auto" ]; then sdef="$(scan_brief stack)"; [ -z "$sdef" ] && sdef="custom"; fi
  ask_choice STACK "Which tech stack?" "$sdef" "${STACKS[@]}"

  # 5 primary assistant
  adef="$ASSISTANT"
  case ",$SECONDARY," in *,copilot,*) [ "$ASSISTANT" = "claude" ] && adef="both" ;; esac
  ask_choice ASSISTANT "Primary AI coding assistant?" "$adef" "claude" "copilot" "factory" "both" "cursor" "other"
  SECONDARY=""
  if [ "$ASSISTANT" != "both" ]; then
    read -r -p "Secondary assistants, comma separated (blank for none): " SECONDARY || true
  fi

  # 6 MCP connectors
  echo ""
  echo "Which MCP connectors? (optional)"
  IDS=(); while IFS= read -r line; do [ -n "$line" ] && IDS+=("$line"); done < <(python3 -c "
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
  # The stack profile's suggestions are the default on a first run; earlier picks win.
  SUGGESTED="$(STACK="$STACK" FRAMEWORK_ROOT="$FRAMEWORK_ROOT" python3 - <<'EOPY'
import json, os
root, stack = os.environ["FRAMEWORK_ROOT"], os.environ.get("STACK", "")
try:
    wanted = json.load(open(os.path.join(root, "profiles", "stacks", stack, "profile.json"))).get("recommendedMcp", [])
except (OSError, ValueError):
    wanted = []
print(",".join(c["id"] for c in json.load(open(os.path.join(root, "mcp", "catalog.json")))["connectors"]
               if c["id"] in wanted and not c.get("requiresUserInput")
               and not (c.get("auth") or {}).get("needsUpfrontCredential")))
EOPY
)"
  MCP_DEFAULT="${MCP:-$SUGGESTED}"
  if [ -n "$MCP_DEFAULT" ]; then
    [ -z "$MCP" ] && echo "  The $STACK stack profile suggests: $SUGGESTED"
    read -r -p "Numbers, comma separated (blank keeps $MCP_DEFAULT; \"none\" for none): " picks || picks=""
  else
    read -r -p "Numbers, comma separated (blank for none): " picks || picks=""
  fi
  MCP=""
  if [ -z "$picks" ]; then
    MCP="$MCP_DEFAULT"
  elif [ "$picks" = "none" ]; then
    MCP=""
  else
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

  # 7 editor
  ask_choice EDITOR_CHOICE "Preferred code editor?" "$EDITOR_CHOICE" "vscode" "cursor" "jetbrains" "none"

  # 8 harness gates
  echo ""
  echo "How strict should the harness gates be? They run in the assistant hooks and in CI."
  echo "  default: the $MODE defaults. custom: choose off, warn or block for each gate."
  ask_choice GATES "Harness gates?" "default" "default" "custom" "warn" "off"
  if [ "$GATES" = "custom" ]; then
    GATES="default"; GATE=()
    for gid in $GATE_IDS; do
      gdef="block"
      if [ "$MODE" = "brownfield" ] && [ "$gid" != "constitution-guard" ] && [ "$gid" != "secrets-scan" ]; then gdef="warn"; fi
      ask_choice gmode "  $gid" "$gdef" "off" "warn" "block"
      GATE+=("$gid=$gmode")
    done
  fi

  echo ""
  echo "Scaffold into $(cd "$(dirname "$TARGET")" 2>/dev/null && pwd || echo "$PWD")/$(basename "$TARGET")?"
  echo "  telemetry=$TELEMETRY mode=$MODE industry=$INDUSTRY stack=$STACK"
  echo "  assistant=$ASSISTANT mcp=${MCP:-none} editor=$EDITOR_CHOICE gates=$GATES ${GATE[*]:-}"
  ask_yn "Proceed?" "y" || { echo ""; echo "Nothing written."; exit 0; }
fi

# ---------------------------------------------------------------- validation
# Runs before the first write, so a tenant-hosted connector with no URL fails with nothing
# half-written. The Node installer validates at the same point.

GATE_JOINED="$(printf '%s\n' "${GATE[@]:-}" | paste -sd'|' -)"
MODE="$MODE" INDUSTRY="$INDUSTRY" STACK="$STACK" GATES="$GATES" GATE_JOINED="$GATE_JOINED" \
TELEMETRY="$TELEMETRY" FRAMEWORK_ROOT="$FRAMEWORK_ROOT" python3 - <<'EOPY' || exit 1
import json, os, sys

env, root = os.environ, os.environ["FRAMEWORK_ROOT"]
defs = json.load(open(os.path.join(root, "scripts", "harness", "gates.json")))
gate_ids, modes = [g["id"] for g in defs["gates"]], list(defs["modes"])


def ids(folder):
    base = os.path.join(root, "profiles", folder)
    return sorted(d for d in os.listdir(base) if os.path.isfile(os.path.join(base, d, "profile.json"))) if os.path.isdir(base) else []


errors = []
if env["TELEMETRY"] not in ("on", "off"):
    errors.append('--telemetry must be on or off, got "%s"' % env["TELEMETRY"])
if env["MODE"] not in ("", "greenfield", "brownfield", "auto"):
    errors.append('--mode must be greenfield, brownfield or auto, got "%s"' % env["MODE"])
industries = ["none"] + ids("industries")
if env["INDUSTRY"] not in industries:
    errors.append('--industry="%s" is unknown. Choose: %s' % (env["INDUSTRY"], " | ".join(industries)))
stacks = ["custom"] + ids("stacks")
if env["STACK"] not in stacks + ["auto"]:
    errors.append('--stack="%s" is unknown. Choose: %s' % (env["STACK"], " | ".join(stacks)))
if env["GATES"] not in ["", "default"] + modes:
    errors.append('--gates must be default, %s, got "%s"' % (" or ".join(modes), env["GATES"]))
for spec in [s for s in env["GATE_JOINED"].split("|") if s]:
    gid, _, value = spec.partition("=")
    if gid not in gate_ids or value not in modes:
        errors.append('--gate="%s" must be <%s>=<%s>' % (spec, "|".join(gate_ids), "|".join(modes)))
for e in errors:
    print(e, file=sys.stderr)
if errors:
    print("\nRun with --help for the flag list.", file=sys.stderr)
sys.exit(1 if errors else 0)
EOPY

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

# --assistant=both is Claude Code primary, GitHub Copilot secondary (as in config-schema.js).
if [ "$ASSISTANT" = "both" ]; then
  ASSISTANT="claude"
  SECONDARY="${SECONDARY:+$SECONDARY,}copilot"
fi
chosen=",$ASSISTANT,$SECONDARY,"
TARGET_COPILOT=0; case "$chosen" in *,copilot,*) TARGET_COPILOT=1 ;; esac
TARGET_FACTORY=0; case "$chosen" in *,factory,*) TARGET_FACTORY=1 ;; esac
TARGET_CLAUDE=0; case "$chosen" in *,claude,*) TARGET_CLAUDE=1 ;; esac
[ "$TARGET_COPILOT" -eq 0 ] && [ "$TARGET_FACTORY" -eq 0 ] && TARGET_CLAUDE=1

integration_for() {
  case "$1" in
    claude|copilot) echo "$1" ;;
    factory) echo "droid" ;;
    cursor) echo "cursor-agent" ;;
    *) echo "generic" ;;
  esac
}
integrations="$(integration_for "$ASSISTANT")"
for s in claude copilot factory; do
  case "$chosen" in *,$s,*) [ "$s" != "$ASSISTANT" ] && integrations="$integrations $(integration_for "$s")" ;; esac
done

if [ "$NO_SPECKIT" -eq 0 ] && command -v uvx >/dev/null 2>&1; then
  for integration in $integrations; do
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "  would: uvx --from git+https://github.com/github/spec-kit.git specify init --here --force --non-interactive --integration $integration"
    else
      ( cd "$TARGET" && uvx --from git+https://github.com/github/spec-kit.git specify init \
          --here --force --non-interactive --integration "$integration" ) \
        || { echo "  - specify init --integration $integration failed — vendored templates used instead"; break; }
    fi
  done
else
  echo "  - Speckit init skipped (uvx absent or --no-speckit); vendored templates used"
fi

for d in commands agents skills hooks templates; do
  [ "$TARGET_CLAUDE" -eq 1 ] || break
  [ -d "$FRAMEWORK_ROOT/$d" ] || continue
  run mkdir -p "$TARGET/.claude/sdd-speckit"
  if [ "$DRY_RUN" -eq 1 ]; then echo "  would: copy $d/ -> .claude/sdd-speckit/$d/"
  else cp -R "$FRAMEWORK_ROOT/$d" "$TARGET/.claude/sdd-speckit/"; echo "  - copied $d/"; fi
done

# .mcp.json, .claude/settings.json, .specify/sdd-speckit.json and the editor files all share the
# framework's own JSON metadata, so python3 does the merge rather than a fragile shell rewrite.
# write-config.py then runs scripts/onboard-project.py, which pins the support files, composes
# the templates for the industry and stack, and wires the harness gates.
CUSTOM_JOINED="$(printf '%s\n' "${MCP_CUSTOM[@]:-}" | paste -sd'|' -)"
INPUT_JOINED="$(printf '%s\n' "${MCP_INPUT[@]:-}" | paste -sd'|' -)"

DRY_RUN="$DRY_RUN" TARGET="$TARGET" FRAMEWORK_ROOT="$FRAMEWORK_ROOT" \
TELEMETRY="$TELEMETRY" OTEL_EXPORTER="$OTEL_EXPORTER" OTEL_ENDPOINT="$OTEL_ENDPOINT" \
MODE="$MODE" INDUSTRY="$INDUSTRY" GATES="$GATES" GATE_JOINED="$GATE_JOINED" \
STACK="$STACK" ASSISTANT="$ASSISTANT" SECONDARY="$SECONDARY" MCP="$MCP" \
EDITOR_CHOICE="$EDITOR_CHOICE" MCP_CUSTOM_JOINED="$CUSTOM_JOINED" MCP_INPUT_JOINED="$INPUT_JOINED" \
python3 "$FRAMEWORK_ROOT/installer/write-config.py"

if [ "$TARGET_CLAUDE" -eq 1 ]; then
cat <<EOF

Claude Code — register the plugin
  claude plugin marketplace add $FRAMEWORK_ROOT
  claude plugin install sdd-speckit@sdd-speckit-framework
Or, inside an interactive Claude Code session:
  /plugin marketplace add $FRAMEWORK_ROOT
  /plugin install sdd-speckit@sdd-speckit-framework

Next step in Claude Code
  /sdd-speckit:speckit.onboard
  It checks the setup. A new project then goes to the constitution and the first feature spec.
  An existing codebase goes to discovery, a derived constitution and baseline specs.
EOF
fi
if [ "$TARGET_COPILOT" -eq 1 ]; then
cat <<EOF

GitHub Copilot — nothing to register
  The phases are skills in .github/skills/sdd-speckit-*/, and the phase agents are in .github/agents/.
  Commit .github/ and .specify/sdd-speckit/ so the Copilot cloud agent sees them on the default branch.
  The Copilot cloud agent does not read .mcp.json. Add the same servers in the repository's
  Settings → Copilot → Coding agent → MCP configuration.

Next step in GitHub Copilot
  /sdd-speckit-onboard
EOF
fi
if [ "$TARGET_FACTORY" -eq 1 ]; then
cat <<EOF

Factory Droid — install the plugin
  droid plugin marketplace add $FRAMEWORK_ROOT
  droid plugin install sdd-speckit@sdd-speckit-framework --scope project
  Or use /plugins inside a session. For a shared repo, point the marketplace at your published
  copy of the framework (owner/repo) rather than a local path. See docs/FACTORY.md.

Next step in Factory Droid
  /sdd-speckit-onboard
EOF
fi
