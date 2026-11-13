# Checklist: Authorisation to operate readiness

**Feature:** [FEATURE NAME] · **Kind:** ato-readiness
**Created:** [YYYY-MM-DD] · **Owner:** [Role: ISSO or security lead]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.
- Control ids are NIST SP 800-53 Rev. 5. The baseline is the one the constitution names.

**Gates:** the tasks phase for the first three sections, and release for all of them. A **no**
here means the feature cannot be shown to an assessor.

## Categorisation and baseline

| # | Item | Status | Note |
|---|---|---|---|
| C001 | The spec lists every information type the feature handles, each with a confidentiality, integrity and availability impact (FIPS 199). | [ ] | |
| C002 | The system owner approved the categorisation, by name and date (RA-2). | [ ] | |
| C003 | The feature does not raise the system impact level, or the rise is approved and the baseline is re-selected (FIPS 199; FedRAMP Rev. 5). | [ ] | |
| C004 | The risks this feature adds are assessed and recorded in the plan (RA-3). | [ ] | |

## Control implementation

| # | Item | Status | Note |
|---|---|---|---|
| C005 | The plan's control implementation summary has a row for every baseline control the feature implements, changes or relies on. | [ ] | |
| C006 | Each row states its origin: implemented here, inherited, shared or planned. No row is blank. | [ ] | |
| C007 | Each inherited control names the provider, and the provider's authorisation covers the required impact level (SA-9). | [ ] | |
| C008 | Each implemented control names evidence that a pipeline or a test produces (SA-11). | [ ] | |
| C009 | Access control rows cover account management, enforcement and least privilege (AC-2, AC-3, AC-6). | [ ] | |
| C010 | Authentication rows cover organisational and public users, and authenticator management (IA-2, IA-5, IA-8). | [ ] | |

## Boundary and residency

| # | Item | Status | Note |
|---|---|---|---|
| C011 | The plan states whether the authorisation boundary changes, and the boundary diagram is current. | [ ] | |
| C012 | Every data flow that crosses the boundary is listed with its protection and its agreement (SC-7, SC-8, SA-9). | [ ] | |
| C013 | Data, backups, logs and support access stay in the permitted jurisdiction, and the data model names each location. | [ ] | |
| C014 | A security impact analysis is done for the change, and the ISSO has ruled on whether it is significant (CM-4). | [ ] | |

## Cryptography

| # | Item | Status | Note |
|---|---|---|---|
| C015 | Every cryptographic use is in the plan's inventory with the module, its version and its FIPS 140-3 certificate number (SC-13). | [ ] | |
| C016 | Each certificate is active, not historical or revoked, on the day of release. | [ ] | |
| C017 | Each module runs in its approved mode in every environment, and a check in the pipeline proves it. | [ ] | |
| C018 | Key generation, storage, rotation and destruction are described, with the roles that may use each key (SC-12). | [ ] | |

## Audit and records

| # | Item | Status | Note |
|---|---|---|---|
| C019 | The events to log are listed, and each record holds what happened, when, where, the source, the outcome and the identity (AU-2, AU-3). | [ ] | |
| C020 | Audit records are protected from change and deletion, including by administrators of the feature (AU-9). | [ ] | |
| C021 | Audit records are kept for the required period, and a named role reviews them (AU-6, AU-11). | [ ] | |
| C022 | Each record type has a records schedule item, a retention period and a disposition step (SI-12). | [ ] | |

## Configuration and supply chain

| # | Item | Status | Note |
|---|---|---|---|
| C023 | The configuration baseline and all settings for the feature are in version control (CM-2, CM-6). | [ ] | |
| C024 | Every change passes through the approved change process, with a record (CM-3). | [ ] | |
| C025 | A software bill of materials is produced for each release build, and the component inventory is updated (CM-8). | [ ] | |
| C026 | The release artifact is tied to a reviewed commit, and its integrity can be verified (SA-10, SI-7). | [ ] | |
| C027 | No component is unsupported, or each has a replacement plan and a recorded risk decision (SA-22). | [ ] | |
| C028 | Only the functions, ports and services the feature needs are enabled (CM-7). | [ ] | |

## Assessment evidence

| # | Item | Status | Note |
|---|---|---|---|
| C029 | Vulnerability scans of code, dependencies, images and hosts are current for the release commit (RA-5). | [ ] | |
| C030 | Each finding is remediated inside its window, or is in the plan of action and milestones with an owner and a date (SI-2). | [ ] | |
| C031 | The system security plan text for the changed controls is drafted and sent to the ISSO. | [ ] | |
| C032 | Monitoring and alerting cover the new components (SI-4). | [ ] | |

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
