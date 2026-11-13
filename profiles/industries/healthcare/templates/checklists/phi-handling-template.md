# Checklist: PHI handling

**Feature:** [FEATURE NAME] · **Kind:** phi-handling
**Created:** [YYYY-MM-DD] · **Owner:** [Role]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.
- This checklist follows protected health information (PHI) through the feature: in, use, out,
  copies, and removal. It is engineering guidance, not a compliance determination. The privacy
  officer confirms the result.

**Gates:** the tasks phase. A **no** here needs a decision from the privacy officer before implementation.

## Inventory and minimum necessary

| # | Item | Status | Note |
|---|---|---|---|
| C001 | The spec's PHI inventory lists every PHI element the feature collects, derives, shows, stores or sends (§164.502(b)). | [ ] | |
| C002 | Each element has a purpose and a reason why less would not do (§164.502(b), §164.514(d)). | [ ] | |
| C003 | Each element is marked as one of the 18 Safe Harbor identifier types, as health data, or as both (§164.514(b)(2)). | [ ] | |
| C004 | The data model's PHI classification lists the same fields as the inventory, and no others. | [ ] | |
| C005 | Each role's view of a record is limited to the elements that role needs (§164.514(d)(2)). | [ ] | |

## Use and disclosure

| # | Item | Status | Note |
|---|---|---|---|
| C006 | Each use and each disclosure is for treatment, payment or operations, is otherwise permitted, or has the patient's authorisation recorded (§164.502(a), §164.506, §164.508). | [ ] | |
| C007 | Each routine disclosure sends only the elements its purpose needs, and the plan lists them (§164.514(d)(3)). | [ ] | |
| C008 | Each recipient outside the organisation is a permitted recipient, or a business associate with a signed agreement (§164.502(e), §164.504(e)). | [ ] | |
| C009 | A restriction or a confidential-communication request that a patient has been granted is honoured by this feature (§164.522). | [ ] | |
| C010 | Disclosures that must be accounted for are recorded with date, recipient, content and purpose (§164.528). | [ ] | |

## Interoperability

| # | Item | Status | Note |
|---|---|---|---|
| C011 | Each exchange in the spec maps to named FHIR R4 resources and profiles in the plan (HL7 FHIR R4). | [ ] | |
| C012 | An outbound resource carries only the elements the exchange needs. Optional elements that hold PHI are left out unless justified (§164.502(b)). | [ ] | |
| C013 | Inbound resources are validated, and a record is attached to a patient only when the match rule in the plan is met. | [ ] | |
| C014 | The calling system or user is authorised for the specific patient and data category before a resource is returned (§164.312(a)(1)). | [ ] | |

## Copies, logs and tools

| # | Item | Status | Note |
|---|---|---|---|
| C015 | Logs, traces, metrics, error reports and analytics hold no PHI element, and a test proves it (§164.502(b)). | [ ] | |
| C016 | Every secondary copy of PHI is listed with its protection: cache, search index, queue, export, report, backup (§164.312(a)(2)(iv)). | [ ] | |
| C017 | Notifications, emails and messages carry no PHI, or go through a channel the plan approves for PHI (§164.312(e)(1)). | [ ] | |
| C018 | No PHI is sent to an AI model, a support tool or a monitoring service that has no business associate agreement (§164.502(e)). | [ ] | |
| C019 | Screens, exports and printouts that show PHI are limited to authorised users, and bulk export is audited (§164.312(b)). | [ ] | |

## Non-production and de-identification

| # | Item | Status | Note |
|---|---|---|---|
| C020 | Development, test, demo and training environments hold only synthetic or de-identified data (§164.514(a)). | [ ] | |
| C021 | A de-identified extract removes all 18 identifier types, or has an Expert Determination on record (§164.514(b)(1), §164.514(b)(2)). | [ ] | |
| C022 | An automated check runs on every non-production data load and fails on an identifier. | [ ] | |
| C023 | No re-identification key or code leaves production, and codes are not derived from the identifiers they replace (§164.514(c)). | [ ] | |
| C024 | Fixtures, screenshots, recordings and documentation in the repository contain only invented patients. | [ ] | |

## Retention, disposal and breach readiness

| # | Item | Status | Note |
|---|---|---|---|
| C025 | Each PHI entity has a retention period with its legal or contractual basis in the data model. | [ ] | |
| C026 | Disposal makes PHI unreadable in the primary store and states what happens to backups (§164.310(d)(2)(i)). | [ ] | |
| C027 | A correction to a record is stored as an amendment, and the original stays retrievable (§164.526). | [ ] | |
| C028 | The audit trail can answer, for an incident: which patients, which elements, who, and when (§164.312(b), §164.404(c)). | [ ] | |
| C029 | The breach runbook names who performs the risk assessment and who notifies, within 60 calendar days of discovery at the latest (§164.402, §164.404(b)). | [ ] | |

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
