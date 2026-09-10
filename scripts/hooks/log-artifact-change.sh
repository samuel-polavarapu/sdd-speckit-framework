#!/bin/sh
# PostToolUse: append one changelog line when a core SDD artifact is written.
set -u

payload=$(cat)

target=$(printf '%s' "$payload" | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)
except Exception:
    print(""); sys.exit(0)
ti = d.get("tool_input") or {}
print(ti.get("file_path") or ti.get("path") or "")
')

[ -n "$target" ] || exit 0

case "$(basename "$target")" in
  spec.md|plan.md|tasks.md) ;;
  *) exit 0 ;;
esac

dir=$(dirname "$target")
[ -d "$dir" ] || exit 0

log="$dir/CHANGELOG.md"
if [ ! -f "$log" ]; then
  printf '# Artifact changelog\n\nAppended automatically when spec.md, plan.md or tasks.md is written.\n\n' > "$log"
fi

printf -- '- %s — `%s` written\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(basename "$target")" >> "$log"
exit 0
