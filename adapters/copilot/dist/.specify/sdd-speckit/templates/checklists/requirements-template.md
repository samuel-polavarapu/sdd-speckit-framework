# Checklist: Requirements quality

**Feature:** [FEATURE NAME] · **Kind:** requirements
**Created:** [YYYY-MM-DD] · **Owner:** [Role]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.

**Gates:** the plan phase. A **no** here means the spec is not ready to plan against.

## Completeness

| # | Item | Status | Note |
|---|---|---|---|
| C001 | Every user scenario has at least one acceptance scenario in Given / when / then form. | [ ] | |
| C002 | Every functional requirement has an acceptance statement that a tester can run. | [ ] | |
| C003 | Every non-functional requirement has a number, a unit and a place where it is measured. | [ ] | |
| C004 | Edge cases cover empty, maximum, duplicate, concurrent and failure conditions. | [ ] | |
| C005 | Out of scope lists what a reader might otherwise assume is included. | [ ] | |
<!-- slot:completeness-rows -->

## Clarity

| # | Item | Status | Note |
|---|---|---|---|
| C006 | No requirement uses a vague quantity: fast, easy, robust, user-friendly, as needed. | [ ] | |
| C007 | No requirement names a technology, a library, a schema or an API shape. | [ ] | |
| C008 | Each requirement states one capability. No requirement joins two with "and". | [ ] | |
| C009 | Every `[NEEDS CLARIFICATION]` marker is resolved, or listed in Open questions with an owner. | [ ] | |
<!-- slot:clarity-rows -->

## Consistency

| # | Item | Status | Note |
|---|---|---|---|
| C010 | No two requirements contradict each other. | [ ] | |
| C011 | Every key entity is used by at least one requirement, and every requirement's nouns are key entities. | [ ] | |
| C012 | Success criteria can be measured with the instrument named. | [ ] | |
| C013 | The spec does not contradict a constitution principle or non-negotiable. | [ ] | |
<!-- slot:consistency-rows -->

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
