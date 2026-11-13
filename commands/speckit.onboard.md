---
name: speckit.onboard
description: Onboard a project to spec-driven development — detect greenfield or brownfield, compose the templates for the industry and stack, generate AGENTS.md, CLAUDE.md and the CI gates, wire the harness, then route to the next phase. Run it once after install, and again after a profile change.
argument-hint: "[greenfield | brownfield] [--industry=<id>] [--stack=<id>] — blank detects and keeps recorded answers"
model: sonnet
---

# Phase 0 — Onboard

You are bringing a repository under the framework. A script does the deterministic part. You fill
what only a reader of the repository can fill, and you route the user to the right next phase.

## Read first

| File | What you learn |
|---|---|
| `.specify/sdd-speckit.json` | The recorded mode, industry, stack, targets and gate modes. Absent means first run. |
| `AGENTS.md`, `CLAUDE.md` | Whether the project already has agent instructions. They are merged, never replaced. |
| `.specify/memory/constitution.md` | Whether a constitution exists. |
| `.specify/discovery/report.md` | Whether discovery already ran (brownfield). |

## Do

### 1. Settle mode, industry and stack

Run the scan. It reads; it writes nothing.

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/discover-scan.py" . --brief
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/compose-templates.py" --list
```

<!-- claude-only:start -->
When `${CLAUDE_PLUGIN_ROOT}` is not set in the shell, use the pinned copy:
`.specify/sdd-speckit/scripts/`.
<!-- claude-only:end -->

- An answer in the record or in `$ARGUMENTS` is settled. Do not ask for it again.
- **Mode.** The scan proposes `greenfield` (no source to speak of) or `brownfield`. Show the
  evidence it gives and ask the user to confirm only when the record has no mode.
- **Industry.** Offer the industry profiles from `--list` plus `none`. Show each profile's
  standards. Never pick an industry for the user: it decides which regulatory gates the
  constitution gets.
- **Stack.** Offer the scan's proposal first, then the other stack profiles, then `custom`.

### 2. Preview, then apply

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/onboard-project.py" --project . --mode <mode> --industry <id> --stack <id> --dry-run
```

Show the user the list of files it would write. **In a brownfield repository, wait for a yes
before you apply.** Then run the same command without `--dry-run`.

What the script does, so you do not do it by hand:

| Step | Result |
|---|---|
| Pin | `.specify/sdd-speckit/` holds the templates, profiles and gate runner, so CI needs no plugin. |
| Compose | `.specify/templates/overrides/` gets each phase template that a profile overlays. `AGENTS.md`, `CLAUDE.md`, `.github/workflows/sdd-gates.yml`, the pull request and issue templates, `CODEOWNERS` and the first ADR are generated. |
| Merge | An existing `AGENTS.md` or `CLAUDE.md` keeps its text; the framework owns only its marked block. An existing `CODEOWNERS` or ADR is kept. A generated file that someone edited is kept and reported. |
| Wire | `.claude/settings.json` gets the permission rules and the gate hooks. `.gitignore` gets the local state paths. |
| Record | `.specify/sdd-speckit.json` gets the mode, industry, stack, globs, commands and gate modes. |

Gate defaults: greenfield starts every gate at **block**. Brownfield starts the process gates at
**warn**, and keeps `constitution-guard` and `secrets-scan` at **block**. Change one gate with
`--gate <id>=<off|warn|block>`. Do not lower a gate unless the user asks.

### 3. Fill what the script cannot know

The generated `AGENTS.md` block has `[NEEDS CLARIFICATION]` cells where no stack profile supplied
a value. Resolve them from the repository, **outside the marked block**, in a section named
`## Project notes`:

- The real install, test, lint and format commands, read from the manifest and the CI workflow.
  Run nothing destructive to find them.
- The source and test directories, when they differ from the recorded globs. Then correct
  `harness.sourceGlobs` and `harness.testGlobs` in `.specify/sdd-speckit.json` — a wrong glob
  makes every gate silent.
- Replace the placeholder owners in `.github/CODEOWNERS` only when the user names them.

Do not edit inside the `sdd-speckit:begin` / `sdd-speckit:end` block, and do not edit a file whose
first lines say `sdd-speckit:composed`. The next run replaces both.

### 4. Check the harness

```bash
python3 .specify/sdd-speckit/scripts/harness/gate.py status
python3 .specify/sdd-speckit/scripts/compose-templates.py --project . --check
```

Report the mode of each gate. A failed `--check` means a composed file is stale: say which.

## Write to

- Through the script: the files in the table above.
- By hand: `## Project notes` in `AGENTS.md`, the globs and commands in
  `.specify/sdd-speckit.json`, named owners in `.github/CODEOWNERS`.

Never write source code in this phase. Never write `.specify/memory/constitution.md`.

## Report

- Mode, industry and stack, and for each: recorded, detected, or chosen now.
- Every file written, merged, or kept, as the script reported it.
- Each gate and its mode.
- Every `[NEEDS CLARIFICATION]` you could not resolve, and who can.
- Standards the industry profile brought in. Say that the profile is engineering guidance and
  that the organisation's compliance owner must confirm it.

Then route by mode:

- **Greenfield:** next run `/sdd-speckit:speckit.constitution`, then
  `/sdd-speckit:speckit.specify` for the first feature.
- **Brownfield:** next run `/sdd-speckit:speckit.discover`. The constitution comes after it, so
  that it is derived from what the code does.
