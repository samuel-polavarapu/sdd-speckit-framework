# Checklist: Accessibility

**Feature:** [FEATURE NAME] · **Kind:** accessibility
**Created:** [YYYY-MM-DD] · **Owner:** [Role]

## How to use

- Answer every item **yes**, **no**, or **not applicable**. Never leave an item blank.
- A **no** needs an owner and a date in the Note column.
- A **not applicable** needs the reason in the Note column.
- The checklist gates the phase named below. Do not start that phase while a **no** stands.

**Gates:** the converge phase. A **no** here blocks release of a user-facing change.

## Perceivable

| # | Item | Status | Note |
|---|---|---|---|
| C001 | Every non-text element has a text alternative, or is marked decorative. | [ ] | |
| C002 | Text contrast is at least 4.5:1, and 3:1 for large text and interface components. | [ ] | |
| C003 | No information is carried by colour alone. | [ ] | |
| C004 | Content reflows at 320 CSS pixels wide with no loss and no two-direction scrolling. | [ ] | |
<!-- slot:perceivable-rows -->

## Operable

| # | Item | Status | Note |
|---|---|---|---|
| C005 | Every function works with the keyboard alone, and no focus trap exists. | [ ] | |
| C006 | Focus is visible, is not hidden by other content and follows a logical order. | [ ] | |
| C007 | Pointer targets are at least 24 by 24 CSS pixels, or have that much spacing. | [ ] | |
| C008 | Motion and time limits can be paused, extended or turned off. | [ ] | |
<!-- slot:operable-rows -->

## Understandable

| # | Item | Status | Note |
|---|---|---|---|
| C009 | Every form field has a programmatic label, and errors are described in text next to the field. | [ ] | |
| C010 | The page language is set, and navigation is consistent between pages. | [ ] | |
| C011 | A user is not asked to re-enter information already given in the same flow. | [ ] | |
<!-- slot:understandable-rows -->

## Robust

| # | Item | Status | Note |
|---|---|---|---|
| C012 | Custom components expose name, role and value to assistive technology. | [ ] | |
| C013 | Status messages are announced without moving focus. | [ ] | |
| C014 | An automated accessibility check runs in CI on the new or changed views, with zero violations. | [ ] | |
| C015 | A manual pass with a screen reader covers the primary user story. | [ ] | |
<!-- slot:robust-rows -->

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
