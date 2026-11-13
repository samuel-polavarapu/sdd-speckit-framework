<!-- @slot technical-context-extra-rows -->
| Cardholder data environment | [in scope / connected / out of scope — from the spec's scope verdict; PCI DSS 12.5.2] |
| Money representation | [Exact decimal type or integer minor units, currency code alongside; rounding rule] |
| Ledger store | [Append-only store, and how updates and deletes are prevented] |
| Idempotency | [Key source, scope and retention window] |
| Payer authentication | [Strong customer authentication provider and factors, or "not applicable"; PSD2 Art. 97] |
| Message standard | [ISO 20022 messages and usage guideline version, or "not applicable"] |
| Change ticket system | [Where change tickets live, and how a PR links one; SOX §404 ITGC] |

<!-- @slot constitution-check-rows -->
| G-FS-1 Cardholder data scope declared | [PASS / FAIL] | [Scope verdict from the spec, and the data-flow diagram below.] |
| G-FS-2 Segregation of duties | [PASS / FAIL] | [Named author, approver and deployer roles; how the pipeline enforces it.] |
| G-FS-3 Change ticket linked | [PASS / FAIL] | [Ticket id, or where it will be linked.] |
| G-FS-4 Exactly-once money movement | [PASS / FAIL / N/A] | [Idempotency key, ledger and reconciliation design below.] |

<!-- @slot test-strategy-extra-rows -->
| Idempotency | Every money-moving operation: repeat, concurrent repeat, replay after timeout | [Tool.] | Zero duplicate postings |
| Reconciliation | Ledger against a simulated external record, including an injected break | [Tool.] | Every injected break is detected |
| Money arithmetic | Rounding, currency minor units, allocation of remainders, property-based | [Tool.] | No lost or created minor unit |
| Message conformance | Each ISO 20022 message against its schema and the usage guideline | [Tool.] | Every message type in `contracts/` |
| Payer authentication | Challenge, failure, lock-out, changed amount or payee, each exemption path (RTS (EU) 2018/389 Art. 4, 5) | [Tool.] | Every path in the spec |
| Account data leakage | Logs, traces, error bodies and fixtures scanned for account data (PCI DSS 3.3.1, 3.4.1) | [Tool.] | Zero finding |

<!-- @slot risks-rows -->
| R-FS-1 | A retry or a replayed message posts a movement twice. | [L/M/H] | H | [Idempotency key with a unique constraint; reconciliation alert. Owner.] |
| R-FS-2 | Account data reaches a log, a trace, an analytics event or a test fixture (PCI DSS 3.3.1, 6.5.5). | [L/M/H] | H | [Masking at the boundary; leakage scan in CI. Owner.] |
| R-FS-3 | The change brings a new component into the cardholder data environment without anyone noticing (PCI DSS 12.5.2). | [L/M/H] | H | [Scope checklist before tasks; data-flow diagram review. Owner.] |
| R-FS-4 | A change reaches production without an independent approval or a ticket (SOX §404 ITGC). | [L/M/H] | H | [Branch protection; deploy role separate from author. Owner.] |
| R-FS-5 | The ledger and the external record drift apart and nobody is told. | [L/M/H] | H | [Scheduled reconciliation; break alert with an owner. Owner.] |

<!-- @slot rollout-items -->
- **Change ticket:** [Id and link. Approved by, on what date.] (SOX §404 ITGC; PCI DSS 6.5.1)
- **Deployer:** [Role. Not the author of the change.] (PCI DSS 6.5.4)
- **In-flight money:** [What happens to movements that are pending when the rollout or the rollback runs.]
- **Post-release reconciliation:** [First reconciliation after release: when, and who signs it.]

<!-- @slot sections-before-open-questions -->
## Cardholder data environment impact

Skip the table only when the spec's scope verdict is "out of scope", and say so here.

[Account data flow diagram or description: where account data enters, each component it
passes, where it rests, where it leaves (PCI DSS 1.2.4).]

| Component | Stores | Processes | Transmits | In scope | Control that applies |
|---|---|---|---|---|---|
| [Name] | [Elements, or "none"] | [yes / no] | [To whom] | [CDE / connected / out] | [e.g. unreadable at rest — PCI DSS 3.5.1; strong cryptography in transit — 4.2.1] |

- **Scope reduction:** [Tokenisation, a hosted payment field or redirection. Which party then holds the account data (PCI DSS 12.8.5).]
- **Segmentation:** [How out-of-scope components are isolated from the cardholder data environment, and how that is tested (PCI DSS 11.4.5).]
- **Keys:** [Where cryptographic keys live, who can use them, rotation (PCI DSS 3.6.1, 3.7).]

## Money movement design

| Operation | Idempotency key | Ledger entries | Failure and retry behaviour | Reconciled against |
|---|---|---|---|---|
| [Name] | [Source, scope, retention] | [Debit and credit, balanced] | [Timeout, partial failure, compensation] | [External record, period] |

- **Ledger immutability:** Entries are appended, never updated or deleted. A correction is a
  new reversing entry that references the original. Enforced by: [mechanism].
- **Money type:** [Exact decimal or integer minor units]. Currency is stored with every amount.
  Rounding: [rule and where it is applied]. No binary floating point at any layer, including
  serialisation.
- **Consistency:** [How the ledger posting and the external call stay consistent: outbox, saga
  or two-step with a pending state. What state a crash leaves behind, and what repairs it.]
- **Reconciliation:** [Sources compared, schedule, matching key, break tolerance, who is alerted,
  how a break is resolved and recorded (SOX §404 ITGC — computer operations).]

## Audit trail design

| Event | Fields recorded | Store | Retention |
|---|---|---|---|
| [Money movement / account data access / privileged action / authentication attempt] | [Actor, action, target, time, outcome, origin — PCI DSS 10.2.2] | [Where] | [Period — PCI DSS 10.5.1] |

- **Tamper resistance:** [How records are protected from change, and how a change would be detected (PCI DSS 10.3.2, 10.3.4).]
- **No account data in the trail:** [How account numbers are masked or referenced by token (PCI DSS 3.4.1).]
- **Traceability:** [The identifier that ties a request, its ledger entries and its messages together.]

## Payer authentication and message conformance

- **Strong customer authentication:** [Factors used, and how they are independent (RTS (EU) 2018/389 Art. 9).]
- **Dynamic linking:** [How the authentication code is bound to the amount and the payee, and
  what the payer is shown (RTS (EU) 2018/389 Art. 5).]
- **Failure handling:** [Attempt limit and lock-out, inactivity time-out (RTS (EU) 2018/389 Art. 4).]
- **Exemptions:** [Each exemption relied on, its condition and where the decision is recorded
  (RTS (EU) 2018/389 Art. 10–18), or "none".]
- **Messages:** [Each ISO 20022 message sent or received, its version, the usage guideline, and
  which field carries the end-to-end identifier.]

<!-- @slot artifacts-items -->
- [ ] `checklists/pci-scope.md`
- [ ] `checklists/sox-change.md`
