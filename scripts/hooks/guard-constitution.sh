#!/bin/sh
# PreToolUse guard: block Write/Edit to .specify/memory/constitution.md unless the
# /speckit.constitution command has taken the unlock marker.
#
# The PreToolUse payload carries the tool call, not the user's prompt, so the hook cannot
# detect which command is running. The marker is what makes this check deterministic.
# This guards against an accidental edit from another phase. It is not a security boundary.
set -u

payload=$(cat)

target=$(printf '%s' "$payload" | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)
except Exception:
    print(""); sys.exit(0)
ti = d.get("tool_input") or {}
print(ti.get("file_path") or ti.get("path") or ti.get("notebook_path") or "")
')

case "$target" in
  */.specify/memory/constitution.md|.specify/memory/constitution.md) ;;
  *) exit 0 ;;
esac

root="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -f "$root/.specify/.constitution-unlock" ] && exit 0

cat >&2 <<'MSG'
Blocked: .specify/memory/constitution.md is governed.

That file is the project constitution. Every other phase is checked against it, so a direct edit
would change the rules with no version bump and no amendment-log entry.

Run /sdd-speckit:speckit.constitution to amend it. That command bumps the version, records the
change in Article V, and reports which existing artifacts the amendment now conflicts with.

The command takes the unlock marker itself:
  mkdir -p .specify/memory && touch .specify/.constitution-unlock
  # write the file
  rm -f .specify/.constitution-unlock
MSG
exit 2
