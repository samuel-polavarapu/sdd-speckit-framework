---
name: "sdd-speckit-taskstoissues"
description: "Turn the tasks of a feature into issues in the project's tracker, in dependency order, with each issue linked back to its task and requirement. Creates nothing until the user has seen the list and said yes."
argument-hint: "[spec id, e.g. 001-orders — defaults to the active feature] [--dry-run]"
disable-model-invocation: true
---

<!-- Generated from commands/speckit.taskstoissues.md by sdd-speckit-framework. Edit the source, then re-run --emit=copilot. -->

> **SDD Speckit phase `taskstoissues`.** Model tier: **haiku**.

# Tasks to issues

You publish `tasks.md` to the tracker the team already uses. `tasks.md` stays the source of
truth: an issue points to its task, and never the other way round.

## Read first

1. `specs/<NNN>-<slug>/tasks.md` — default to the feature in `.specify/.active-spec`.
2. `specs/<NNN>-<slug>/spec.md` — for the requirement each task covers.
3. `specs/<NNN>-<slug>/issues.md` — when it exists, some tasks already have an issue.

## Refuse to start when

- `tasks.md` does not exist. Send the user to `/sdd-speckit-tasks`.
- No tracker is reachable: no GitHub or Atlassian connector in `.mcp.json`, and no `gh` login.
  Say which is missing. Do not write issue text to a file and call it done.
- The Git remote is not the repository the user expects. Show the remote and ask. An issue
  created in the wrong repository cannot be moved back quietly.

## Do

1. List the unticked tasks in `tasks.md` order. Skip a task that `issues.md` already maps.
2. Build one issue per task:
   - **Title:** `[<NNN>-<slug>] T### — <the task, as written>`
   - **Body:** the task row, the file path, the requirement ids it covers, the task ids it
     depends on, and a link to `tasks.md` and `spec.md` at the current commit.
   - **Labels:** `sdd`, the feature id, and `parallel` when the task is marked `[P]`.
3. **Show the full list and wait for a yes.** Creating issues is visible to the whole team and
   is not undone by deleting a file. With `--dry-run`, stop here.
4. Create the issues in dependency order, so that a task's issue can name the issues it depends
   on. Use the connector the project has; use `gh issue create` only when there is none.
5. Stop at the first failure. Report what was created. Do not retry in a loop.
6. Never put a secret, a credential or personal data in an issue.

## Write to

`specs/<NNN>-<slug>/issues.md` — one row per task: task id, issue number, link, created date.
Nothing else. `tasks.md` is not changed.

## Report

- Issues created, with their numbers and links.
- Tasks skipped because they already had an issue.
- Anything that failed, with the tracker's message.
