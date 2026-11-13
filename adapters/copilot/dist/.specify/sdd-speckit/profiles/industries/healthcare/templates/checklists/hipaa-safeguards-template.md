# Checklist: HIPAA safeguards

**Feature:** [FEATURE NAME] · **Kind:** hipaa-safeguards
**Created:** [YYYY-MM-DD] · **Owner:** [Role]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.
- This checklist maps a feature to the HIPAA Security Rule (45 CFR Part 164 Subpart C). It is
  engineering guidance, not a compliance determination. The security officer confirms the result.

**Gates:** the tasks phase. A **no** here needs a task, or a decision from the security officer, before implementation starts.

## Administrative safeguards (§164.308)

| # | Item | Status | Note |
|---|---|---|---|
| C001 | The security risk analysis covers every PHI store, flow and third party this feature adds (§164.308(a)(1)(ii)(A)). | [ ] | |
| C002 | Each risk the analysis found for this feature has a mitigation in the plan, or a recorded acceptance (§164.308(a)(1)(ii)(B)). | [ ] | |
| C003 | The plan names who reviews audit records and access reports for this feature, and how often (§164.308(a)(1)(ii)(D)). | [ ] | |
| C004 | Access to PHI is granted by role, and the plan names who authorises a grant and how it is removed (§164.308(a)(3), §164.308(a)(4)). | [ ] | |
| C005 | The incident runbook says how a suspected PHI incident in this feature is detected, reported and recorded (§164.308(a)(6)). | [ ] | |
| C006 | PHI the feature creates is in the backup, and the plan states how the feature works or degrades in an emergency (§164.308(a)(7)). | [ ] | |
| C007 | Each third party that creates, receives, maintains or transmits PHI has a signed business associate agreement (§164.308(b)(1)). | [ ] | |

## Technical safeguards — access (§164.312(a), §164.312(d))

| # | Item | Status | Note |
|---|---|---|---|
| C008 | Every user and every service has a unique identity. No PHI operation runs under a shared account (§164.312(a)(2)(i)). | [ ] | |
| C009 | Authorisation is checked on the server for each record, so that a user cannot reach another patient's data by changing an identifier (§164.312(a)(1)). | [ ] | |
| C010 | An emergency access procedure exists, is time-limited, records a reason and is reviewed afterwards (§164.312(a)(2)(ii)). | [ ] | |
| C011 | Sessions end after the idle limit the plan states for each client type (§164.312(a)(2)(iii)). | [ ] | |
| C012 | A person or system is authenticated before it reaches PHI, and the plan states the strength required (§164.312(d)). | [ ] | |

## Technical safeguards — audit and integrity (§164.312(b), §164.312(c))

| # | Item | Status | Note |
|---|---|---|---|
| C013 | Each PHI create, read, update, delete, export and disclosure writes an audit event with actor, action, patient, record, time, origin and outcome (§164.312(b)). | [ ] | |
| C014 | Denied attempts and emergency access are audited (§164.312(b)). | [ ] | |
| C015 | Audit events hold identifiers only, with no clinical content (§164.312(b), §164.502(b)). | [ ] | |
| C016 | Audit records cannot be changed or deleted by the application or by its users, and tampering is detectable (§164.312(c)(1)). | [ ] | |
| C017 | Improper alteration or destruction of PHI is detectable, and the plan names the mechanism (§164.312(c)(1), §164.312(c)(2)). | [ ] | |
| C018 | An automated test fails when a PHI operation emits no audit event (§164.312(b)). | [ ] | |

## Technical safeguards — encryption and transmission (§164.312(a)(2)(iv), §164.312(e))

| # | Item | Status | Note |
|---|---|---|---|
| C019 | PHI is encrypted at rest in every store, including backups, caches, search indexes, queues and exports (§164.312(a)(2)(iv)). | [ ] | |
| C020 | PHI is encrypted in transit on every hop, including internal service-to-service traffic (§164.312(e)(1), §164.312(e)(2)(ii)). | [ ] | |
| C021 | The plan names the algorithms, the protocol versions, who holds the keys and how keys are rotated (§164.312(a)(2)(iv)). | [ ] | |
| C022 | PHI sent to another system is protected against undetected modification in transit (§164.312(e)(2)(i)). | [ ] | |

## Devices, media and documentation (§164.310, §164.316)

| # | Item | Status | Note |
|---|---|---|---|
| C023 | PHI kept on a device the user holds is encrypted, is the minimum needed, and can be removed remotely or expires (§164.310(d)(1)). | [ ] | |
| C024 | Media and stores that held PHI are made unreadable before reuse or disposal (§164.310(d)(2)(i), §164.310(d)(2)(ii)). | [ ] | |
| C025 | Safeguard decisions for this feature are written down, and the record is kept six years (§164.316(b)(1), §164.316(b)(2)(i)). | [ ] | |

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
