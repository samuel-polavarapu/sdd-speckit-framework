<!-- @slot principles -->
### Principle FS-1: Money moves exactly once

Every money movement is applied once, recorded in an append-only ledger and reconciled against
an independent record.

**Rationale:** A retry, a timeout or a replayed message that posts twice is a financial loss and
a reporting error. A ledger that can be edited cannot be audited.

**In practice:** A reviewer looks for an idempotency key on every operation that moves money, a
correction posted as a new entry and never as an update, exact decimal amounts with an explicit
currency, and a reconciliation that would catch a break.

### Principle FS-2: Account data is kept out unless the feature cannot work without it

Cardholder data and sensitive authentication data stay outside the system wherever a reference
or a token will do.

**Rationale:** Every component that stores, processes or transmits account data joins the
cardholder data environment and carries the full control set (PCI DSS 12.5.2).

**In practice:** A reviewer looks for a scope statement in the spec, a data-flow diagram in the
plan, and no account data in logs, test fixtures, analytics or prompts.

<!-- @slot gates-rows -->
| G-FS-1 | Cardholder data scope declared | Every spec states whether the feature stores, processes or transmits account data, and whether each changed component is inside, connected to or outside the cardholder data environment (PCI DSS 12.5.2, 1.2.4). | `checklists/pci-scope.md` verdict; scope section of `spec.md` |
| G-FS-2 | Segregation of duties | The author of a change does not approve it, and neither the author nor the approver alone deploys it to production (SOX §404 ITGC — program changes; PCI DSS 6.2.3.1, 6.5.4). | PR approval record; deployment record |
| G-FS-3 | Change ticket linked | Every change to a production system links an approved change ticket that records impact, testing and back-out (SOX §404 ITGC — program changes; PCI DSS 6.5.1). | Ticket link in the PR; `checklists/sox-change.md` |
| G-FS-4 | Exactly-once money movement | Every operation that moves money is idempotent, posts to an append-only ledger and has a reconciliation. Amounts are exact decimals with a currency. | Plan "Money movement design"; idempotency and reconciliation tests |

<!-- @slot quality-bar-items -->
- **Account data handling:** No sensitive authentication data is stored after authorisation
  (PCI DSS 3.3.1). A stored account number is unreadable (3.5.1) and masked on display (3.4.1).
- **Money arithmetic:** Amounts are exact decimals or integer minor units with an explicit
  currency. Binary floating point is not used for money. Rounding rule: [PLACEHOLDER].
- **Reconciliation:** Every money movement reconciles against [PLACEHOLDER: independent record]
  every [PLACEHOLDER: period]. An unexplained break raises an alert within [PLACEHOLDER].
- **Audit trail:** Every money movement and every access to account data is logged with actor,
  action, target, time and outcome (PCI DSS 10.2.1, 10.2.2), protected from change (10.3.2) and
  kept for [NEEDS CLARIFICATION: retention period; PCI DSS 10.5.1 sets at least 12 months].
- **Payer authentication:** Electronic payments in scope of PSD2 apply strong customer
  authentication with dynamic linking (PSD2 Art. 97; RTS (EU) 2018/389 Art. 4, 5), or record the
  exemption relied on (RTS Art. 10–18).
- **Message conformance:** Payment messages validate against the ISO 20022 message definition
  and the usage guideline of [PLACEHOLDER: scheme or market infrastructure].

<!-- @slot governance-items -->
- **Compliance owner:** [ROLE] confirms the control mapping in Annex R, and reviews it when a
  cited standard changes version.
- **Scope review:** The cardholder data environment scope is confirmed at least every 12 months
  and on every significant change (PCI DSS 12.5.2). Owner: [ROLE].
- **Control evidence:** Change tickets, approvals, test results and deployment records are kept
  for [NEEDS CLARIFICATION: evidence retention period set by the compliance owner] and are
  retrievable for an audit (SOX §404 ITGC).
- **Gate waivers:** A waiver of G-FS-1 to G-FS-4 also needs the compliance owner's written
  approval. An emergency change gets its ticket and review within [PLACEHOLDER: e.g. 2 business days].

<!-- @slot annexes -->
## Annex R — Regulatory controls (Financial services and payments)

| Standard / control | What the project must do | Where it is evidenced |
|---|---|---|
| PCI DSS v4.0.1 12.5.2, 1.2.4 | Document the scope and keep an accurate account data flow diagram. | Spec "Cardholder data scope"; plan "Cardholder data environment impact"; `checklists/pci-scope.md` |
| PCI DSS v4.0.1 3.2.1, 3.3.1, 3.4.1, 3.5.1 | Minimise stored account data, never keep sensitive authentication data after authorisation, mask on display, make stored account numbers unreadable. | `data-model.md` "Account data classification"; security checklist |
| PCI DSS v4.0.1 6.2.3.1, 6.5.1–6.5.6 | Review code before release by someone other than the author, follow change control, keep live account numbers and test data out of the wrong environment. | PR approval record; `checklists/sox-change.md` |
| PCI DSS v4.0.1 10.2.1, 10.2.2, 10.3.2, 10.5.1 | Log access and actions, protect the logs, retain them. | Plan "Audit trail design" |
| SOX §404 ITGC — program changes | Authorise, test and approve every change, with duties segregated. | Change ticket; `checklists/sox-change.md`; gates G-FS-2, G-FS-3 |
| SOX §404 ITGC — access to programs and data | Grant least privilege, review access, remove it on role change. | Access review record; security checklist |
| SOX §404 ITGC — computer operations | Monitor jobs, resolve failures, reconcile financial data between systems. | Plan "Money movement design"; reconciliation reports |
| PSD2 (EU) 2015/2366 Art. 97; RTS (EU) 2018/389 Art. 4, 5, 9 | Apply strong customer authentication with independent factors and dynamic linking; record exemptions. | Spec NFR-FS-04; plan "Payer authentication and message conformance" |
| ISO 20022 | Validate payment messages against the message definition and the scheme usage guideline. | `contracts/`; conformance tests |

This annex is engineering guidance, not legal or compliance advice. The organisation's
compliance owner must confirm the mapping before the project relies on it.
