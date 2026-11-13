# Checklist: PCI DSS scope

**Feature:** [FEATURE NAME] · **Kind:** pci-scope
**Created:** [YYYY-MM-DD] · **Owner:** [Role]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.
- If the scope verdict in `spec.md` is "out of scope", answer the first section in full. The
  other sections may then be **not applicable**, with that verdict as the reason.

**Gates:** the tasks phase. A **no** here blocks constitution gate G-FS-1. Standard: PCI DSS v4.0.1.

## Scope determination

| # | Item | Status | Note |
|---|---|---|---|
| C001 | The spec states whether the feature stores, processes or transmits account data, with no blank answer (PCI DSS 12.5.2). | [ ] | |
| C002 | Every component the feature adds or changes is classed as inside the cardholder data environment, connected to it or out of scope, with the reason (PCI DSS 12.5.2). | [ ] | |
| C003 | The account data flow diagram in the plan shows every flow this feature adds or changes, and is current (PCI DSS 1.2.4). | [ ] | |
| C004 | The inventory of in-scope system components is updated for this feature (PCI DSS 12.5.1). | [ ] | |
| C005 | Derived copies of account data (caches, search indexes, queues, exports, backups, analytics) are identified and included in scope (PCI DSS 12.5.2). | [ ] | |

## Storage

| # | Item | Status | Note |
|---|---|---|---|
| C006 | Each stored account data element has a business need, a retention period and a disposal step (PCI DSS 3.2.1). | [ ] | |
| C007 | No sensitive authentication data (full track, card verification code, PIN) is retained after authorisation (PCI DSS 3.3.1). | [ ] | |
| C008 | Every stored account number is unreadable at rest, and the plan names the method (PCI DSS 3.5.1). | [ ] | |
| C009 | Cryptographic keys that protect stored account data are themselves protected, with access limited to the fewest custodians (PCI DSS 3.6.1). | [ ] | |
| C010 | An account number is masked on every display, and full display is limited to roles with a documented need (PCI DSS 3.4.1). | [ ] | |

## Transmission and segmentation

| # | Item | Status | Note |
|---|---|---|---|
| C011 | Account data sent over an open or public network is protected with strong cryptography (PCI DSS 4.2.1). | [ ] | |
| C012 | Traffic into and out of the cardholder data environment is restricted to what this feature needs (PCI DSS 1.3.1, 1.3.2). | [ ] | |
| C013 | Where segmentation keeps a component out of scope, the control is named and a segmentation test covers it (PCI DSS 11.4.5). | [ ] | |
| C014 | Every script on a payment page is authorised, integrity-checked and inventoried (PCI DSS 6.4.3). | [ ] | |

## Third parties and environments

| # | Item | Status | Note |
|---|---|---|---|
| C015 | Each third party that stores, processes or transmits account data for this feature is on the service provider list (PCI DSS 12.8.1). | [ ] | |
| C016 | A written record shows which PCI DSS requirements each third party manages and which stay with this project (PCI DSS 12.8.5). | [ ] | |
| C017 | No live account number is used in development or test, and fixtures use documented test numbers only (PCI DSS 6.5.5). | [ ] | |
| C018 | Access to account data and its use are logged for every new in-scope component (PCI DSS 10.2.1). | [ ] | |

## Scope record

| Field | Value |
|---|---|
| Scope verdict | [in scope / connected / out of scope] |
| Account data elements | [List, or "none"] |
| Components added to scope | [List, or "none"] |
| Components removed from scope | [List, or "none"] |
| Scope confirmed by | [Role, date] |

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
