# Checklist: Section 508 conformance

**Feature:** [FEATURE NAME] · **Kind:** section-508
**Created:** [YYYY-MM-DD] · **Owner:** [Role: accessibility lead]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.
- References are to the Revised 508 Standards (36 CFR 1194) and to WCAG 2.0 Level A and AA
  success criteria. It complements the `accessibility` checklist; it does not replace it.

**Gates:** the converge phase. A **no** here blocks release of a user-facing change.

## Scope and exceptions

| # | Item | Status | Note |
|---|---|---|---|
| C001 | Every surface the feature adds or changes is listed: views, documents, emails, media and support material (E205, E207). | [ ] | |
| C002 | No exception is claimed, or each claimed exception is approved in writing by the agency's Section 508 programme (E202). | [ ] | |
| C003 | Where an exception applies, an alternative means gives users with disabilities access to the same information (E202). | [ ] | |

## User interface (WCAG 2.0 Level AA)

| # | Item | Status | Note |
|---|---|---|---|
| C004 | Non-text content has a text alternative (SC 1.1.1). | [ ] | |
| C005 | Structure and relationships, such as headings, lists, tables and form groups, are exposed programmatically (SC 1.3.1). | [ ] | |
| C006 | Text contrast is at least 4.5:1, or 3:1 for large text (SC 1.4.3). | [ ] | |
| C007 | All functionality works from the keyboard, with no keyboard trap (SC 2.1.1, 2.1.2). | [ ] | |
| C008 | Keyboard focus is visible and follows a meaningful order (SC 2.4.3, 2.4.7). | [ ] | |
| C009 | Form fields have labels or instructions, and errors are identified in text (SC 3.3.1, 3.3.2). | [ ] | |
| C010 | Every interface component exposes its name, role and value (SC 4.1.2). | [ ] | |
| C011 | The page language is set programmatically (SC 3.1.1). | [ ] | |

## Electronic content and media

| # | Item | Status | Note |
|---|---|---|---|
| C012 | Public-facing documents and official agency communications the feature produces conform to WCAG 2.0 Level AA (E205.4). | [ ] | |
| C013 | Generated documents are tagged, have a reading order and a title, and their tables have headers. | [ ] | |
| C014 | Emails and notifications are readable without images and without colour. | [ ] | |
| C015 | Prerecorded video has captions and audio description, and live video has captions (SC 1.2.2, 1.2.4, 1.2.5). | [ ] | |

## Software and assistive technology

| # | Item | Status | Note |
|---|---|---|---|
| C016 | The software does not disrupt platform accessibility features or assistive technology (502). | [ ] | |
| C017 | Media players give user controls for captions and audio description at the same level as volume (503.4). | [ ] | |
| C018 | Where the feature lets users author content, it lets them produce accessible content and prompts them to (504). | [ ] | |
| C019 | Where a function is not reachable through assistive technology, the functional performance criteria are met another way (E204, 302). | [ ] | |

## Support documentation and services

| # | Item | Status | Note |
|---|---|---|---|
| C020 | User documentation describes the accessibility features and is itself in an accessible format (602). | [ ] | |
| C021 | Help and support channels can serve users with disabilities, and support staff know the accessibility features (603). | [ ] | |

## Testing and conformance report

| # | Item | Status | Note |
|---|---|---|---|
| C022 | An automated accessibility check runs in CI on the changed views, with zero Level A or AA failure. | [ ] | |
| C023 | A manual pass with the keyboard alone and with a screen reader covers the primary user story. | [ ] | |
| C024 | The test method, the tools and their versions, and the assistive technology used are recorded. | [ ] | |
| C025 | The accessibility conformance report is updated for the changed areas, and each "partially supports" or "does not support" entry has a remediation date. | [ ] | |
| C026 | Each known defect is tracked with an owner, and users are told the workaround. | [ ] | |

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
