---
name: speckit.discover
description: Brownfield discovery — scan an existing codebase and write a discovery report of its technology, architecture, conventions, test state and feature areas, with evidence and confidence for every finding. Reads the code; changes none of it.
argument-hint: "[path or area to limit the read to — blank reads the whole repository]"
model: sonnet
---

# Brownfield 1 — Discover

You are describing a codebase **as it is**. You record what you observed, where, and how sure you
are. You recommend nothing here; the adoption roadmap does that later.

## This command changes no source file

It writes two files under `.specify/discovery/` and nothing else. It does not fix, format,
upgrade or delete anything it finds, however obvious the fix looks.

## Read first

1. `.specify/sdd-speckit.json` — the recorded mode, industry and stack.
2. The template `discovery-report-template.md`. **Template resolution:** use
   `.specify/templates/overrides/<file>` when it exists, otherwise
   `${CLAUDE_PLUGIN_ROOT}/templates/<file>`. A line of the form `<!-- slot:… -->` is a composition
   marker: never copy it into an artifact.
3. `.specify/discovery/report.md` — when it exists, you are **refreshing** it. Keep the answers
   people already gave to its Unknowns.

## Do

### 1. Take the deterministic facts

```bash
mkdir -p .specify/discovery
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/discover-scan.py" . > .specify/discovery/inventory.json
git rev-parse --short HEAD
```

<!-- claude-only:start -->
When `${CLAUDE_PLUGIN_ROOT}` is not set in the shell, use `.specify/sdd-speckit/scripts/`.
<!-- claude-only:end -->

The inventory gives languages, manifests, top-level layout, test files, CI workflows, lint and
format configs, and the most changed files. Counts and paths in the report come from it, so that
two runs agree. Do not recount by hand.

### 2. Map what a scan cannot see

Delegate to the **codebase-cartographer** subagent. Give it the inventory and the limit in
`$ARGUMENTS`. In a large repository, run one cartographer per top-level area in parallel, then
merge. Ask for:

- The architectural style, and how one request or job flows through the system, end to end.
- Components: path, one responsibility, what each depends on. Where layering holds, where it leaks.
- External interfaces and data stores, and where each is defined.
- Conventions the code follows **consistently**. Two competing patterns are an inconsistency, not
  a convention: record both, with a path for each.
- Feature areas: the units a user or another system would name. These become baseline specs.
- Hotspots: much-changed code without tests, dead code, duplicated logic, pinned old dependencies.

### 3. Write the report

1. Fill every section of the template. Every row carries **evidence** (a path, or `path:line`)
   and a **confidence** from the template's scale. A finding with no evidence does not go in.
2. Keep observation and opinion apart. "No test covers `billing/`" is an observation. "Billing is
   fragile" is not.
3. Record sensitive data by **kind and location only**. Never copy a value, a credential or a
   personal record into the report.
4. Put what the code does not say in **Unknowns**, each as
   `[NEEDS CLARIFICATION: the specific question]` with the role that can answer. Do not guess the
   intent behind code; ask.
5. Rank the feature areas for baseline specs: high for areas that change often or that the next
   planned work touches.

## Write to

- `.specify/discovery/inventory.json` — the scan, unedited.
- `.specify/discovery/report.md`

## Report

- The commit the report was read at, and how much of the repository you read.
- The technology and architecture, three lines at most.
- The feature areas, with their baseline priority.
- The top hotspots, one line each.
- Every Unknown, numbered, and who can answer it.
- Where the scan's proposed source or test globs look wrong. Wrong globs make the gates silent.

Then say: have a person answer the Unknowns that block the constitution, then run
`/sdd-speckit:speckit.constitution` — it derives the principles from this report. After that,
run `/sdd-speckit:speckit.baseline`.
