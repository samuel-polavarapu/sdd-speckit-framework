# Checklist: Privacy

**Feature:** [FEATURE NAME] · **Kind:** privacy
**Created:** [YYYY-MM-DD] · **Owner:** [Role]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.

**Gates:** the tasks phase. A **no** here needs a decision from the privacy owner before implementation.

## Data inventory

| # | Item | Status | Note |
|---|---|---|---|
| C001 | Every personal data element the feature collects, derives or stores is listed in the data model. | [ ] | |
| C002 | Each element has a stated purpose, and the feature uses it for that purpose only. | [ ] | |
| C003 | Each element has a classification and a named owner. | [ ] | |
<!-- slot:inventory-rows -->

## Minimisation and retention

| # | Item | Status | Note |
|---|---|---|---|
| C004 | The feature collects only what its purpose needs. Each optional element is justified. | [ ] | |
| C005 | Each element has a retention period, and an automated job or documented step deletes it. | [ ] | |
| C006 | Non-production environments use synthetic or de-identified data. | [ ] | |
<!-- slot:minimisation-rows -->

## Rights and transparency

| # | Item | Status | Note |
|---|---|---|---|
| C007 | A person can obtain, correct and delete their data, and the plan names the mechanism. | [ ] | |
| C008 | Consent, where it is the basis, is recorded with a time and a version, and can be withdrawn. | [ ] | |
| C009 | The privacy notice covers this processing, or its update is a task. | [ ] | |
<!-- slot:rights-rows -->

## Sharing and transfer

| # | Item | Status | Note |
|---|---|---|---|
| C010 | Each third party that receives personal data is listed, with the agreement that covers it. | [ ] | |
| C011 | Personal data stays in the regions the project allows. | [ ] | |
| C012 | An impact assessment is done, or is recorded as not needed with the reason. | [ ] | |
<!-- slot:sharing-rows -->

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
