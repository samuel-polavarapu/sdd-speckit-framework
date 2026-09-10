# [PROJECT NAME] Constitution

<!--
  Governing document. Every spec, plan, and task is checked against it.
  Amend it only through /speckit.constitution, never by direct edit.
-->

**Version:** [MAJOR.MINOR.PATCH] · **Ratified:** [YYYY-MM-DD] · **Last amended:** [YYYY-MM-DD]

## Purpose

[One paragraph. What this codebase is for, and who it serves.]

## Article I — Guiding principles

### Principle 1: [NAME]

[Statement of the principle in one sentence.]

**Rationale:** [Why this principle exists. What went wrong without it.]

**In practice:** [What a reviewer looks for.]

### Principle 2: [NAME]

[Statement.]

**Rationale:** [Why.]

**In practice:** [What a reviewer looks for.]

### Principle 3: [NAME]

[Statement.]

**Rationale:** [Why.]

**In practice:** [What a reviewer looks for.]

## Article II — Non-negotiables

These are gates. A change that fails a gate does not merge.

| # | Gate | Rule | Verified by |
|---|---|---|---|
| N1 | Test-first | A failing test exists and is committed before the implementation that satisfies it. | Review of commit order in the PR |
| N2 | Spec before code | No feature code merges without a `spec.md` and a `plan.md` in `specs/<NNN>-<feature>/`. | `/speckit.analyze` report |
| N3 | Agent output is reviewed | No AI-authored change merges without a named human reviewer. | PR approval record |
| N4 | Clarify before build | Every `[NEEDS CLARIFICATION]` marker is resolved before `/speckit.tasks`. | `/speckit.clarify` |
| N5 | [PLACEHOLDER: org gate] | [Rule.] | [How it is checked.] |

**Escape hatch.** A gate is waived only by [ROLE], in writing, in the PR description, with an
expiry date. Record every waiver in Article V.

## Article III — Quality bar

- **Test coverage:** [NEEDS CLARIFICATION: minimum threshold, and is it enforced in CI?]
- **Performance budget:** [NEEDS CLARIFICATION: target latency or throughput, and where measured]
- **Accessibility:** [PLACEHOLDER: standard and conformance level]
- **Security:** [PLACEHOLDER: scanning, dependency policy, secret handling]
- **Observability:** [PLACEHOLDER: what every service must emit]

## Article IV — Governance

- **Amendment process:** Propose through `/speckit.constitution`. [ROLE] approves. Record the
  change in Article V.
- **Versioning:** Semantic.
  - **MAJOR** — a principle or non-negotiable is removed or reversed.
  - **MINOR** — a principle, gate, or article is added.
  - **PATCH** — wording, examples, or typos, with no change of meaning.
- **Review cadence:** [PLACEHOLDER: e.g. every quarter]
- **Precedence:** This document outranks every other project document. Where a plan and this
  document disagree, this document wins, and the plan is corrected.

## Article V — Amendment log

| Version | Date | Change | Approved by |
|---|---|---|---|
| 0.1.0 | [YYYY-MM-DD] | Initial ratification. | [NAME] |

## Article VI — [PLACEHOLDER: org-specific article]

[Add articles your organization requires: data residency, licensing, procurement, regulatory
controls. Delete this article if you need none.]
