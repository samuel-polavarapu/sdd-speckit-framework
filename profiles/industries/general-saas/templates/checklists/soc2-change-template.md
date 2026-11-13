# Checklist: SOC 2 change management

**Feature:** [FEATURE NAME] · **Kind:** soc2-change
**Created:** [YYYY-MM-DD] · **Owner:** [Role]
**Change record:** [Link or id] · **Change type:** [Standard / normal / emergency]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.
- Put a link to the evidence in the Note column of every **yes**. An auditor samples changes and
  asks for exactly this evidence.

**Gates:** release. A **no** here stops the production deployment. An emergency change completes
this checklist after the fact, within [PLACEHOLDER: days].

## Authorisation

| # | Item | Status | Note |
|---|---|---|---|
| C001 | A change request exists in the system of record, and this change links to it (SOC 2 CC8.1). | [ ] | |
| C002 | The request states what changes, why, and which systems and tenants are affected (SOC 2 CC8.1). | [ ] | |
| C003 | The change was authorised by the owner of the affected system before development started (SOC 2 CC8.1). | [ ] | |
| C004 | The risk of the change is assessed, including its effect on security, availability and personal data (SOC 2 CC3.4, CC8.1). | [ ] | |

## Design and development

| # | Item | Status | Note |
|---|---|---|---|
| C005 | The change traces to a `spec.md` and a `plan.md`, and every commit is on a branch under version control (SOC 2 CC8.1). | [ ] | |
| C006 | Development and testing happened outside production, with no production personal data (SOC 2 CC8.1; GDPR Art. 32). | [ ] | |
| C007 | Infrastructure and configuration changes are in version control and follow this same process (SOC 2 CC8.1, CC7.1). | [ ] | |
| C008 | Every new dependency or vendor was assessed before it was added (SOC 2 CC9.2). | [ ] | |

## Testing

| # | Item | Status | Note |
|---|---|---|---|
| C009 | The full automated test suite passed on the exact commit being deployed, and the result is stored (SOC 2 CC8.1). | [ ] | |
| C010 | The negative cross-tenant tests passed on that commit (SOC 2 CC6.1). | [ ] | |
| C011 | Security scans (static analysis, dependencies, secrets) ran on that commit, and each high or critical finding is fixed or has a recorded exception (SOC 2 CC7.1). | [ ] | |
| C012 | The acceptance scenarios in `spec.md` were verified in a pre-production environment (SOC 2 CC8.1). | [ ] | |

## Review and approval

| # | Item | Status | Note |
|---|---|---|---|
| C013 | A named human other than the author reviewed and approved the change, and the approval is recorded on the change (SOC 2 CC8.1). | [ ] | |
| C014 | Every AI-authored part of the change was reviewed by a named human (SOC 2 CC8.1). | [ ] | |
| C015 | Branch protection prevented a merge without approval and passing checks, and no bypass was used (SOC 2 CC8.1). | [ ] | |
| C016 | Approval for production deployment was given after testing finished, by a role authorised to give it (SOC 2 CC8.1). | [ ] | |

## Deployment

| # | Item | Status | Note |
|---|---|---|---|
| C017 | The deployment ran through the automated pipeline from the approved commit, with no manual change in production (SOC 2 CC8.1). | [ ] | |
| C018 | The person or identity that deployed could not also have approved their own change (SOC 2 CC8.1, CC6.3). | [ ] | |
| C019 | The deployment log records who, what version, when and to which environment, and is retained (SOC 2 CC8.1). | [ ] | |
| C020 | Affected customers and internal users were told of the change where the commitments require it (SOC 2 CC2.2, CC2.3). | [ ] | |

## Rollback and post-deployment

| # | Item | Status | Note |
|---|---|---|---|
| C021 | The rollback path is written down and was run in a pre-production environment (SOC 2 CC8.1). | [ ] | |
| C022 | The rollback handles data written and schema changed since the deployment (SOC 2 CC8.1, A1.2). | [ ] | |
| C023 | The signals named in the plan were checked after deployment, and the result is recorded (SOC 2 CC7.2). | [ ] | |
| C024 | If this was an emergency change, it was approved by an authorised role, and its review and this checklist were completed afterwards (SOC 2 CC8.1). | [ ] | |

## Evidence index

| Evidence | Location |
|---|---|
| Change request | [Link.] |
| Test and scan results for the deployed commit | [Link.] |
| Review and approval record | [Link.] |
| Deployment log entry | [Link.] |
| Rollback test record | [Link.] |

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
