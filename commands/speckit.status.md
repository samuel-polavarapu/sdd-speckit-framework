---
name: speckit.status
description: Read-only status of a feature — which phases have written their artifact, which human approvals are valid, stale or missing, each gate's mode, and the one next step. Use it to resume work after a break.
argument-hint: "[spec id, e.g. 001-orders — defaults to the active feature]"
model: haiku
disallowed-tools: ["Write", "Edit", "NotebookEdit"]
---

# Status and resume (read-only)

You report where a feature stands and what comes next. You change nothing: no file, no gate
mode, no approval.

## Do

1. Take the facts from the gate runner. Do not work them out yourself.

   ```bash
   python3 .specify/sdd-speckit/scripts/harness/gate.py status --json
   ```

   <!-- claude-only:start -->
   When the project has no pinned copy, use `${CLAUDE_PLUGIN_ROOT}/scripts/harness/gate.py`.
   <!-- claude-only:end -->

2. When `$ARGUMENTS` names another feature, read `specs/<NNN>-<slug>/` and its `approvals/`
   directory for that feature instead. List `specs/` when the user asks which features exist.
3. Read, when they exist: the last ten lines of `.specify/harness-log.jsonl` (what the gates
   last stopped or warned about), the unticked tasks in `tasks.md`, and the open items in
   `converge-report.md`.

## Report

One table, then four lines.

| Phase | Artifact | Written | Approval |
|---|---|---|---|

- **Next step:** the `next` value from the runner, as the command to run.
- **Waiting on a person:** every approval that is `missing`, `stale` or `insufficient`, with the
  exact command the person runs. Say plainly that you cannot run it: an approval is a person's
  decision.
- **Gates:** each gate and its mode, on one line.
- **Last gate findings:** from the harness log, or "none recorded".

Never estimate. A fact the runner or a file does not give you is "Not recorded".

## Resume

When the user asks to resume, name the next step and stop. Start the phase only when the user
says so. A failed step is retried, not skipped. Never pass a gate by changing its mode.
