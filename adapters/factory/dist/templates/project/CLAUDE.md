@AGENTS.md

## Claude Code

- The phases are plugin commands. Type `/sdd-speckit:` and choose the phase. If no command is
  listed, the plugin is not registered: see the framework's README.
- Each phase command names the phase agent that does the work and the model tier it runs on. Use
  that agent. It carries the right tool set for the phase.
- The analyze phase runs with the write tools removed. That is intended.
- The gate hooks are wired in `.claude/settings.json`. Exit code 2 from a hook means a gate
  blocked the write, and the message says which phase to run.
- Permission rules for this project are in `.claude/settings.json`. Ask before you add one.
- Personal notes go in `CLAUDE.local.md`, which is not committed.
<!-- slot:rules-items -->

<!-- slot:sections-end -->
