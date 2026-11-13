---
name: "sdd-speckit-baseline"
description: "Brownfield baseline — write as-built baseline specs for the existing feature areas, and the adoption roadmap that moves each harness gate from warn to block. Runs after discovery and the derived constitution."
disable-model-invocation: true
---

<!-- Generated from commands/speckit.baseline.md by sdd-speckit-framework. Edit the source, then re-run --emit=factory. -->

> **SDD Speckit phase `baseline`.** Model tier: **opus**.
> Arguments: `[feature area to baseline — blank takes the high-priority areas from the discovery report]`
> Run the phase work in the droids **codebase-cartographer**, **spec-author**, **solution-architect** with the Task tool (`subagent_type` = the droid name). Each droid pins the model and the tool set.

# Brownfield 2 — Baseline

You are recording what the existing system **does**, area by area, so that later feature specs
have a starting point. Then you write the plan that tightens the gates.

## Read first

1. `.specify/discovery/report.md` — the Feature areas table is your work list.
2. `.specify/memory/constitution.md` — the gates, and which principles are marked observed or
   aspirational.
3. `.specify/sdd-speckit.json` — the mode of each gate now.
4. The templates `baseline-spec-template.md` and `adoption-roadmap-template.md`. **Template
   resolution:** use `.specify/templates/overrides/<file>` when it exists, otherwise
   `${DROID_PLUGIN_ROOT}/templates/<file>`. A line of the form `<!-- slot:… -->` is a composition
   marker: never copy it into an artifact.
5. `specs/_baseline/` and `.specify/adoption-roadmap.md` — when they exist, you are updating.
   Keep the ratchet log and every answered question.

## Refuse to start when

- `.specify/discovery/report.md` does not exist. Send the user to
  `/sdd-speckit-discover`.
- `.specify/memory/constitution.md` does not exist. Send the user to
  `/sdd-speckit-constitution`. The roadmap measures the gap to the constitution, so it
  needs one.

## Do

### 1. Baseline specs

Take the area in the arguments given after the command, or every area the report ranks **high**. Say which areas you leave
for later. For each area, delegate the code read to the **codebase-cartographer** subagent and
the writing to the **spec-author** subagent. Areas are independent: run them in parallel.

1. State behaviour as fact: "the system does". Not "the system shall".
2. Cite evidence on every row: `path:line`, a test name, or a route. Mark confidence: **high**
   when a test proves it, **medium** when read in the code, **low** when inferred.
3. A suspected defect goes in **Known gaps**. Do not turn it into a requirement, and do not
   fix it.
4. Behaviour whose intent you cannot tell goes in **Open questions**.
5. Keep it technology-light. Name a store or an interface where the area's behaviour depends on
   it; leave the rest to the discovery report.

A baseline spec lives in `specs/_baseline/`, outside the `NNN-slug` pattern. **It never satisfies
the spec-before-code gate.** A change to the area starts with a new numbered spec that names the
baseline as its starting point.

### 2. Adoption roadmap

Draft directly; use the **solution-architect** subagent when the gap list is long.

1. **Where we are:** current state from the discovery report, target state from the
   constitution, one line of gap each.
2. **Constitution — observed and aspirational:** copy each principle and gate with its status.
   Every aspirational row names the work that makes it true.
3. **Gate ratchet:** one row per gate, with its mode now from `.specify/sdd-speckit.json`. Give
   each an exit criterion that a person can check with a number or a link, an owner role, and a
   target date as `[NEEDS CLARIFICATION]` unless the user gives one. Order the moves: the gate
   with the least work to its criterion goes first. One gate moves at a time.
4. **Baseline coverage:** every feature area in the report, written or not.
5. **Backlog:** ordered, each item naming the gap or gate it closes. Hotspots from the report
   with no test come first when the next planned work touches them.

**You do not change a gate mode here.** The roadmap records the plan. A person moves a gate with
`/sdd-speckit-setup` when its criterion is met, and adds the row to the ratchet log.

## Write to

- `specs/_baseline/<area-slug>/spec.md` — one per area
- `.specify/adoption-roadmap.md`

Never write source code in this phase.

## Report

- Each baseline spec: path, behaviour count, the split by confidence, and the gap count.
- Areas not yet baselined.
- The gate ratchet, as a table: gate, now, next, criterion.
- The first three backlog items.
- Every open question, and who can answer it.

Then say: new work now follows the normal phases, starting with
`/sdd-speckit-specify`. Review the roadmap on the cadence it names.
