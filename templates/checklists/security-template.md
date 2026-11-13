# Checklist: Security

**Feature:** [FEATURE NAME] · **Kind:** security
**Created:** [YYYY-MM-DD] · **Owner:** [Role]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.

**Gates:** the tasks phase. A **no** here needs a task before implementation starts.

## Identity and access

| # | Item | Status | Note |
|---|---|---|---|
| C001 | Every entry point states who may call it, and the check is enforced on the server side. | [ ] | |
| C002 | Authorization is checked per object, not only per route. A user cannot reach another user's record by changing an id. | [ ] | |
| C003 | Sessions and tokens expire, and the plan states the lifetime. | [ ] | |
| C004 | Privileged actions are logged with the actor, the action, the target and the time. | [ ] | |
<!-- slot:identity-rows -->

## Input and output

| # | Item | Status | Note |
|---|---|---|---|
| C005 | Every input from outside the trust boundary is validated against a schema, with a size limit. | [ ] | |
| C006 | Output is encoded for its context. No query, command or markup is built by joining strings with input. | [ ] | |
| C007 | File uploads are checked for type and size, and are stored outside the web root. | [ ] | |
| C008 | Error responses do not reveal stack traces, queries or internal identifiers. | [ ] | |
<!-- slot:input-rows -->

## Data and secrets

| # | Item | Status | Note |
|---|---|---|---|
| C009 | No secret is in the repository, in a container image or in a log line. | [ ] | |
| C010 | Sensitive data is encrypted in transit and at rest, and the plan names the mechanism. | [ ] | |
| C011 | Logs and analytics events contain no credential and no sensitive personal data. | [ ] | |
| C012 | The data model states a retention period and a deletion path for each sensitive entity. | [ ] | |
<!-- slot:data-rows -->

## Dependencies and build

| # | Item | Status | Note |
|---|---|---|---|
| C013 | Every new dependency is pinned, has a licence the project accepts and has no known critical vulnerability. | [ ] | |
| C014 | A dependency scan runs in CI and fails the build on a critical finding. | [ ] | |
| C015 | The threat model in the plan is updated for every new trust boundary. | [ ] | |
| C016 | A rate limit or quota protects each new public operation. | [ ] | |
<!-- slot:supply-chain-rows -->

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
