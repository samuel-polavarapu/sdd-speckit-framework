# Checklist: Static security review

**Feature:** [FEATURE NAME] · **Kind:** sast
**Created:** [YYYY-MM-DD] · **Owner:** [Role]

## How to use

- This is a guided read of the **changed files**, not the output of a scanner. Run the
  project's scanner as well when it has one, and record its result in the last section.
- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- Every **no** becomes a finding in the Findings table, with a severity.
- **A critical finding that is not resolved blocks the feature.** A high finding needs an owner
  and a date before the feature ships.
- This checklist gates: integration tests and release.

| Severity | Meaning |
|---|---|
| critical | An attacker can reach it now: injection, broken authentication, a leaked secret |
| high | Exploitable with a precondition, or it exposes sensitive data |
| medium | A weakness with limited reach, or a missing defence in depth |
| low | A hygiene issue |

## Input and injection

| ID | Check | Answer | Note |
|---|---|---|---|
| C-SA-01 | Does every query use parameters, with no string built from input? | | |
| C-SA-02 | Is every input from outside the trust boundary validated for type, length and range before use? | | |
| C-SA-03 | Does no code pass input to a shell, an interpreter, `eval` or a deserialiser of arbitrary types? | | |
| C-SA-04 | Is every file path built from input checked to stay inside its allowed directory? | | |
| C-SA-05 | Is output encoded for the place it is written to (HTML, SQL, log, header)? | | |
<!-- slot:input-rows -->

## Authentication and access

| ID | Check | Answer | Note |
|---|---|---|---|
| C-SA-06 | Does every new endpoint or handler check who the caller is and what they may do? | | |
| C-SA-07 | Is access checked on the server for the specific record, not only for the route? | | |
| C-SA-08 | Are passwords and tokens stored hashed or encrypted with a current algorithm? | | |
| C-SA-09 | Do sessions and tokens expire, and can they be revoked? | | |
<!-- slot:access-rows -->

## Secrets and data

| ID | Check | Answer | Note |
|---|---|---|---|
| C-SA-10 | Is there no credential, key or token in the code, the tests, the config or the logs? | | |
| C-SA-11 | Do log lines and error messages leave out personal data and secrets? | | |
| C-SA-12 | Is sensitive data encrypted in transit and at rest where the plan says so? | | |
<!-- slot:data-rows -->

## Dependencies and errors

| ID | Check | Answer | Note |
|---|---|---|---|
| C-SA-13 | Is every new dependency pinned, maintained and free of a known critical vulnerability? | | |
| C-SA-14 | Does every failure path close what it opened and return no internal detail to the caller? | | |
| C-SA-15 | Are outbound calls limited by a timeout, and is every outbound address fixed or allow-listed? | | |
<!-- slot:dependency-rows -->

<!-- slot:sections-before-findings -->
## Findings

| ID | Severity | File | Description | Resolved | Owner |
|---|---|---|---|---|---|
| F-01 | [critical / high / medium / low] | `[path:line]` | [What is wrong, and how it could be used] | [yes / no] | [Role] |

## Result

| Item | Value |
|---|---|
| Files reviewed | [n], listed in the note below |
| Scanner run | [tool and result, or "none configured"] |
| Unresolved critical findings | [n] — must be 0 |
| Unresolved high findings | [n], each with an owner and a date |
| Reviewed by | [Role], [YYYY-MM-DD] |
