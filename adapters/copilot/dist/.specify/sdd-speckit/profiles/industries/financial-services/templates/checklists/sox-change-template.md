# Checklist: SOX change control

**Feature:** [FEATURE NAME] · **Kind:** sox-change
**Created:** [YYYY-MM-DD] · **Owner:** [Role]
**Change ticket:** [Id and link] · **Financial reporting impact:** [yes / no]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.
- Each **yes** needs a pointer to its evidence in the Note column: a link, a record id or a file.
  An auditor reads this checklist without the people who filled it in.

**Gates:** release. A **no** here stops the rollout and blocks constitution gates G-FS-2 and G-FS-3.
Standard: SOX section 404 IT general controls, with the matching PCI DSS v4.0.1 change controls.

## Authorisation

| # | Item | Status | Note |
|---|---|---|---|
| C001 | An approved change ticket exists and is linked from the pull request (SOX §404 ITGC — program changes). | [ ] | |
| C002 | The ticket states the reason for the change and its impact, including the impact on financial reporting (PCI DSS 6.5.1). | [ ] | |
| C003 | The approval was given by an authorised party before deployment, and the record shows who and when (PCI DSS 6.5.1). | [ ] | |
| C004 | An emergency change has its ticket, review and approval completed after the fact within the period the constitution sets. | [ ] | |

## Segregation of duties

| # | Item | Status | Note |
|---|---|---|---|
| C005 | The reviewer who approved the code is not its author, including for AI-authored changes (PCI DSS 6.2.3.1; SOX §404 ITGC — program changes). | [ ] | |
| C006 | The person or role that deploys to production is neither the sole author nor the sole approver (PCI DSS 6.5.4). | [ ] | |
| C007 | The pipeline enforces these separations, and nobody bypassed branch protection or a required approval for this change. | [ ] | |
| C008 | Developers have no standing write access to production data or the production ledger (SOX §404 ITGC — access to programs and data; PCI DSS 6.5.3). | [ ] | |

## Testing and evidence

| # | Item | Status | Note |
|---|---|---|---|
| C009 | Test results for the release commit are attached to the ticket or linked from it, and they were produced outside production (PCI DSS 6.5.1, 6.5.3). | [ ] | |
| C010 | The tests show the change does not weaken security or a financial control: idempotency, reconciliation and audit logging still pass (PCI DSS 6.5.1). | [ ] | |
| C011 | The back-out procedure is documented, and it states how in-flight money movements are handled (PCI DSS 6.5.1). | [ ] | |
| C012 | The deployed artefact is traceable to the reviewed commit. | [ ] | |

## Access and operations

| # | Item | Status | Note |
|---|---|---|---|
| C013 | Any new role, permission or service account is approved, least-privilege and added to the access review (SOX §404 ITGC — access to programs and data; PCI DSS 7.2.1, 7.2.2). | [ ] | |
| C014 | New or changed scheduled jobs and interfaces that carry financial data are monitored, and a failure reaches an owner (SOX §404 ITGC — computer operations). | [ ] | |
| C015 | Reconciliation covers every new or changed flow of financial data between systems, with a named reviewer (SOX §404 ITGC — computer operations). | [ ] | |
| C016 | Ticket, approvals, test evidence and deployment record are stored where they are kept for the evidence retention period in the constitution. | [ ] | |

## Change record

| Field | Value |
|---|---|
| Author | [Name] |
| Approver | [Name, date] |
| Deployer | [Name or role, date] |
| Release commit | [Hash] |
| Deployment record | [Link] |

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
