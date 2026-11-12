#!/bin/sh
# Post-tool: append one changelog line when a core SDD artifact is written.
# Runs as a Claude Code PostToolUse hook and as a GitHub Copilot postToolUse hook.
set -u

here=$(dirname "$0")
parsed=$(python3 "$here/_payload.py")

writes=$(printf '%s\n' "$parsed" | head -n 1)
[ "$writes" = "1" ] || exit 0

printf '%s\n' "$parsed" | tail -n +2 | while IFS= read -r target; do
  [ -n "$target" ] || continue
  case "$(basename "$target")" in
    spec.md|plan.md|tasks.md) ;;
    *) continue ;;
  esac

  dir=$(dirname "$target")
  [ -d "$dir" ] || continue

  log="$dir/CHANGELOG.md"
  if [ ! -f "$log" ]; then
    printf '# Artifact changelog\n\nAppended automatically when spec.md, plan.md or tasks.md is written.\n\n' > "$log"
  fi
  printf -- '- %s — `%s` written\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(basename "$target")" >> "$log"
done
exit 0
