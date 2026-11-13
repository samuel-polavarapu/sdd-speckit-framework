# Adoption roadmap: [REPOSITORY NAME]

**Created:** [YYYY-MM-DD] · **Owner:** [Role] · **Review:** [Cadence]
**Inputs:** `.specify/discovery/report.md`, `.specify/memory/constitution.md`, `specs/_baseline/`

How this codebase moves from its current state to full spec-driven development. Gates start at
**warn** and move to **block** one at a time, each on a stated condition.

## Where we are

| Area | Current state | Target state | Gap |
|---|---|---|---|
| Specification | [e.g. tickets only] | [Every change has a spec and a plan.] | [Gap.] |
| Testing | [Observed.] | [The constitution's quality bar.] | [Gap.] |
| Review | [Observed.] | [Named human reviewer on every change.] | [Gap.] |
| CI | [Observed.] | [Gates run on every pull request.] | [Gap.] |
<!-- slot:state-rows -->

## Constitution: observed and aspirational

| Principle or gate | Status | Evidence, or what it takes |
|---|---|---|
| [Name.] | [observed — the code already does this] | [Path.] |
| [Name.] | [aspirational — not true yet] | [The work that makes it true.] |

## Gate ratchet

One gate moves at a time. A gate moves only when its exit criterion is met and the owner signs.

| Gate | Now | Next | Exit criterion to move | Owner | Target date |
|---|---|---|---|---|---|
| constitution-guard | block | block | — | [Role.] | — |
| secrets-scan | block | block | [Zero findings on the default branch.] | [Role.] | [Date.] |
| spec-before-code | warn | block | [Three features shipped through the phases; every active area has a baseline spec.] | [Role.] | [Date.] |
| tasks-before-implement | warn | block | [Same as spec-before-code.] | [Role.] | [Date.] |
| test-first | warn | block | [Test command runs in CI in under N minutes; warn count below N per week.] | [Role.] | [Date.] |
| lint-format | warn | block | [The default branch is lint-clean; the format command changes nothing.] | [Role.] | [Date.] |

Change a gate with the setup phase. Record each move in the log below.

## Baseline coverage

| Feature area | Baseline spec | Confidence | Next action |
|---|---|---|---|
| [Area.] | [`specs/_baseline/[area]/spec.md`, or "not written".] | [high / medium / low] | [Write / review with the owner / done.] |

## Backlog

Ordered. Each item names the gap it closes.

| # | Item | Closes | Size | Owner |
|---|---|---|---|---|
| A1 | [e.g. add the test command to CI.] | [Gap or gate.] | [S / M / L] | [Role.] |
<!-- slot:backlog-rows -->

## Rules while gates are at warn

- New features follow the full phase sequence from the first day.
- A change to existing code needs a spec when it changes behaviour. A fix that restores the
  behaviour in a baseline spec does not.
- Touch a file, leave a test: a change to an untested area adds the test that the baseline lacks.

<!-- slot:sections-before-log -->
## Ratchet log

| Date | Gate | From | To | Approved by | Evidence |
|---|---|---|---|---|---|
| [YYYY-MM-DD] | [Gate.] | [warn] | [block] | [Name.] | [Link.] |
