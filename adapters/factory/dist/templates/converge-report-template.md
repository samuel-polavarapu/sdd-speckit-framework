## Convergence report — specs/[NNN]-[slug]

**Date:** [YYYY-MM-DD] · **Code read at:** `[commit sha]` · **Test run:** [passed / failed / skipped counts]

### Requirement status

| Status | Count | Requirements |
|---|---|---|
| Implemented — code and a covering test | [n] | [FR-…] |
| Partial — code, but no test or an incomplete one | [n] | [FR-…] |
| Missing — no code | [n] | [FR-…] |
| Drifted — code behaves differently | [n] | [FR-…] |

**Convergence:** [n / N] requirements fully implemented and tested.

### Drift detail

| Requirement | The spec says | The code does | Evidence |
|---|---|---|---|
| [FR-00x] | [Quote.] | [Observed behaviour.] | [`path:line`, or the test name.] |

### Code with no requirement

| Path | Assessment | Recommended action |
|---|---|---|
| [`path`] | [Undocumented scope / dead code.] | [Add a requirement / remove.] |

### Constitution gates against the shipped state

| Gate | Status | Evidence |
|---|---|---|
| N1 Test-first | [PASS / FAIL] | [Commit order.] |
| N2 Spec before code | [PASS / FAIL] | [Artifacts present.] |
| N3 Agent output reviewed | [PASS / FAIL] | [Approval record.] |
| N4 Clarify before build | [PASS / FAIL] | [Open marker count.] |
<!-- slot:gates-rows -->

### Tasks appended

[T0xx–T0yy, in `tasks.md` under `## Phase 6 — Convergence`. Tests before fixes.]

### Residual risk

- [A gap that is accepted, by whom, and until when.]

<!-- slot:sections-end -->
