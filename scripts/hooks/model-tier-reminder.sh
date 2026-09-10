#!/bin/sh
# SessionStart: advisory reminder only. Nothing here changes the active model.
set -u
cat <<'MSG'
SDD Speckit — model routing is advisory. Set the tier yourself with /model.

  opus    constitution, plan, analyze, converge   (high-stakes reasoning)
  sonnet  specify, clarify, checklist, tasks, implement
  haiku   research and lookups                    (delegated to research-scout)

Each /sdd-speckit:speckit.* command declares its own tier in frontmatter, and each subagent
declares its own. This reminder covers work you drive by hand. See docs/MODEL_ROUTING.md.
MSG
exit 0
