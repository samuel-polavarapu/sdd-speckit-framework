<!-- @slot checklist-items -->
- [ ] **Change ticket:** <!-- id and link --> is approved and records impact, testing and back-out (SOX §404 ITGC; PCI DSS 6.5.1)
- [ ] The approver is not the author, and the deployer will be neither acting alone (PCI DSS 6.2.3.1, 6.5.4)
- [ ] Cardholder data scope is unchanged, or `checklists/pci-scope.md` and the data-flow diagram are updated (PCI DSS 12.5.2, 1.2.4)
- [ ] No account data in code, fixtures, logs, screenshots or this description; test numbers are documented test values (PCI DSS 3.3.1, 6.5.5)
- [ ] Every operation that moves money has an idempotency test and a reconciliation test, and amounts use the exact money type
- [ ] Ledger and audit records are append-only in this change (PCI DSS 10.3.2)
