#!/bin/sh
# SessionEnd: one-line local usage summary. Silent unless telemetry was opted into.
set -u

settings="${CLAUDE_PROJECT_DIR:-.}/.claude/settings.json"
[ -f "$settings" ] || exit 0

enabled=$(python3 -c '
import json,sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    print("0"); sys.exit(0)
print(str((d.get("env") or {}).get("CLAUDE_CODE_ENABLE_TELEMETRY", "0")))
' "$settings" 2>/dev/null || echo 0)

[ "$enabled" = "1" ] || exit 0

out="${CLAUDE_PROJECT_DIR:-.}/.specify/usage-log.txt"
mkdir -p "$(dirname "$out")" 2>/dev/null || exit 0
printf -- '%s session ended (cwd=%s)\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(basename "${CLAUDE_PROJECT_DIR:-$PWD}")" >> "$out"
exit 0
