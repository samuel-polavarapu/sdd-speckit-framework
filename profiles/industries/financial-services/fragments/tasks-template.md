<!-- @slot conventions-items -->
- A task that moves money has its idempotency test and its reconciliation test before it. This
  is constitution gate G-FS-4.
- Test data uses documented test account numbers only. No live account number enters the
  repository or a pre-production environment (PCI DSS 6.5.5).

<!-- @slot sections-after-phases -->
## Regulatory tasks — Financial services and payments

| ID | Task | File | When needed |
|---|---|---|---|
| R001 | Complete the scope checklist and update the account data flow diagram (PCI DSS 12.5.2, 1.2.4). | `checklists/pci-scope.md` | Every feature |
| R002 | Write the idempotency tests: repeat, concurrent repeat, replay after timeout. | `[path]` | Any operation that moves money |
| R003 | Write the reconciliation test with an injected break, then the reconciliation job. | `[path]` | Any new ledger posting or external record |
| R004 | Write the audit record for each event in the plan's audit trail, with a test that it cannot be altered (PCI DSS 10.2.1, 10.3.2). | `[path]` | Any money movement, account data access or privileged action |
| R005 | Add the leakage test: no account data in logs, traces, errors or fixtures (PCI DSS 3.3.1, 3.4.1). | `[path]` | Any component in or connected to the cardholder data environment |
| R006 | Test strong customer authentication paths: challenge, failure, lock-out, changed amount or payee, each exemption (RTS (EU) 2018/389 Art. 4, 5). | `[path]` | Any payer-initiated payment |
| R007 | Validate each message against its ISO 20022 schema and the usage guideline. | `[path]` | Any payment message sent or received |
| R008 | Link the approved change ticket and complete the change-control checklist (SOX §404 ITGC; PCI DSS 6.5.1). | `checklists/sox-change.md` | Every change to a production system |

<!-- @slot coverage-rows -->
| NFR-FS-01 | R001, R005 |
| NFR-FS-02 | R002 |
| NFR-FS-03 | R004 |
| NFR-FS-04 | R006 |
| NFR-FS-05 | R003 |
| NFR-FS-06 | R007 |

<!-- @slot definition-of-done-items -->
- [ ] `checklists/pci-scope.md` has a PASS verdict, and the data-flow diagram matches what was built (PCI DSS 12.5.2)
- [ ] Idempotency and reconciliation tests pass for every operation that moves money
- [ ] No account data appears in a log, a trace, an error body or a fixture (PCI DSS 3.3.1, 6.5.5)
- [ ] The change ticket is linked and approved, and the approver is not the author (SOX §404 ITGC; PCI DSS 6.2.3.1)
