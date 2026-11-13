#!/bin/sh
# Runs the gate runner as an assistant tool hook.   usage: hook.sh pre|post
#
# Claude Code calls this from the plugin (hooks/hooks.json). GitHub Copilot calls the vendored
# copy (.github/hooks/sdd-speckit.json). A project that the installer has set up also wires the
# vendored runner in .claude/settings.json. When that is so, the plugin's copy stands down, so
# each write is checked once, by the version the project has pinned. Factory Droid's plugin sets
# SDD_SPECKIT_HOST=factory: Droid never runs .claude/settings.json, so its copy never stands down.
set -u

stage="${1:-pre}"
here=$(cd "$(dirname "$0")" && pwd -P)
root=$(cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null && pwd -P) || root="$PWD"
vendored="$root/.specify/sdd-speckit/scripts/harness"

if [ "${SDD_SPECKIT_HOST:-claude}" = claude ] && [ "$here" != "$vendored" ] && [ -f "$vendored/gate.py" ] \
  && grep -qs 'sdd-speckit/scripts/harness/gate.py' "$root/.claude/settings.json"; then
  exit 0
fi

# No python3 means no check. A hook never blocks on its own missing tool.
command -v python3 >/dev/null 2>&1 || exit 0
exec python3 "$here/gate.py" hook "$stage"
