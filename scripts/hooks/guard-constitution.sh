#!/bin/sh
# Pre-tool guard: block a write to .specify/memory/constitution.md unless the constitution phase
# has taken the unlock marker.
#
# Runs as a Claude Code PreToolUse hook (hooks/hooks.json) and as a GitHub Copilot preToolUse hook
# (.github/hooks/sdd-speckit.json). _payload.py reads both payload shapes.
#
# The payload carries the tool call, not the user's prompt, so the hook cannot detect which phase
# is running. The marker is what makes this check deterministic. This guards against an accidental
# edit from another phase. It is not a security boundary.
set -u

here=$(dirname "$0")
parsed=$(python3 "$here/_payload.py")

writes=$(printf '%s\n' "$parsed" | head -n 1)
[ "$writes" = "1" ] || exit 0

printf '%s\n' "$parsed" | tail -n +2 | grep -qE '(^|/)\.specify/memory/constitution\.md$' || exit 0

root="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -f "$root/.specify/.constitution-unlock" ] && exit 0

# Copilot reads a permission decision from stdout. Claude Code ignores stdout on exit 2 and feeds
# stderr back to the model. Exit 2 denies in both.
printf '%s\n' '{"permissionDecision":"deny","permissionDecisionReason":"Blocked: .specify/memory/constitution.md is governed. Amend it through the constitution phase (/sdd-speckit:speckit.constitution in Claude Code, /sdd-speckit-constitution in GitHub Copilot), which takes the unlock marker."}'

cat >&2 <<'MSG'
Blocked: .specify/memory/constitution.md is governed.

That file is the project constitution. Every other phase is checked against it, so a direct edit
would change the rules with no version bump and no amendment-log entry.

Amend it through the constitution phase: /sdd-speckit:speckit.constitution in Claude Code, or
/sdd-speckit-constitution in GitHub Copilot. That phase bumps the version, records the change in
Article V, and reports which existing artifacts the amendment now conflicts with.

The phase takes the unlock marker itself:
  mkdir -p .specify/memory && touch .specify/.constitution-unlock
  # write the file
  rm -f .specify/.constitution-unlock
MSG
exit 2
