# Checklist: Release readiness

**Feature:** [FEATURE NAME] · **Kind:** release
**Created:** [YYYY-MM-DD] · **Owner:** [Role]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.

**Gates:** release. A **no** here stops the rollout.

## Evidence

| # | Item | Status | Note |
|---|---|---|---|
| C001 | Every task in `tasks.md` is ticked, and the implementation log has a row for each. | [ ] | |
| C002 | The full test suite passes on the release commit. | [ ] | |
| C003 | The convergence report shows no Missing and no Drifted requirement, or each one has a written acceptance. | [ ] | |
| C004 | Every constitution gate is green, or has a waiver with an expiry date. | [ ] | |
<!-- slot:evidence-rows -->

## Rollout and rollback

| # | Item | Status | Note |
|---|---|---|---|
| C005 | The rollback path in the plan has been run in a pre-production environment. | [ ] | |
| C006 | Every schema migration is reversible, or its one-way nature is approved in writing. | [ ] | |
| C007 | The feature can be turned off without a deployment, or the reason it cannot is recorded. | [ ] | |
| C008 | The rollout is staged, and the plan names the signal that stops it. | [ ] | |
<!-- slot:rollout-rows -->

## Operations

| # | Item | Status | Note |
|---|---|---|---|
| C009 | Dashboards and alerts exist for the signals named in the plan, and the alert has an owner. | [ ] | |
| C010 | The runbook covers the failure modes listed in the plan's risks. | [ ] | |
| C011 | `quickstart.md` runs from a clean checkout. | [ ] | |
| C012 | Support and on-call staff know what changes, and when. | [ ] | |
<!-- slot:operations-rows -->

## Sign-off

| # | Item | Status | Note |
|---|---|---|---|
| C013 | A named human reviewer approved every change, including every AI-authored change. | [ ] | |
| C014 | Release notes state what changed for the user. | [ ] | |
| C015 | Open questions are closed, or moved to a tracked item with an owner. | [ ] | |
<!-- slot:signoff-rows -->

<!-- slot:sections-before-result -->
## Result

| Field | Value |
|---|---|
| Items | [N] |
| Yes | [N] |
| No | [N] |
| Not applicable | [N] |
| Verdict | [PASS / BLOCKED] |
| Signed off by | [Name, date] |

## Blocking items

| # | Item | Owner | Due | Resolution |
|---|---|---|---|---|
| [C###] | [Item.] | [Role.] | [Date.] | |
