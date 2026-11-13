<!-- @slot rules-items -->
- Never write a real account number, card verification code, PIN or track data to a file, a test, a log, a commit message or a prompt. Use the card schemes' documented test numbers only (PCI DSS 3.3.1, 6.5.5).
- Never log, trace or return an unmasked account number. Mask it at the boundary (PCI DSS 3.4.1).
- Never represent money as binary floating point. Use the project's exact decimal or minor-unit type, and keep the currency with the amount.
- Never update or delete a ledger entry or an audit record. Post a reversing entry that references the original (PCI DSS 10.3.2).
- Never add an operation that moves money without an idempotency key and a test that a repeat posts once.
- Do not approve, merge or deploy your own change, and do not change branch protection, pipeline approvals or deployment roles. A human who is not the author approves (SOX §404 ITGC; PCI DSS 6.2.3.1).
- Do not weaken or bypass strong customer authentication, and do not add an exemption the spec does not name (PSD2 Art. 97).
- If a change makes a component store, process or transmit account data for the first time, stop and say so. The scope checklist must be redone first (PCI DSS 12.5.2).

<!-- @slot sections-end -->
### Regulated domain — Financial services and payments

This project handles payments or financial records. The constitution's Annex R maps each
standard to what the project must do. It is engineering guidance, not compliance advice.

| Topic | Rule | Where it is recorded |
|---|---|---|
| Cardholder data scope | Every spec answers store / process / transmit and gives a scope verdict (gate G-FS-1). | `spec.md`, `checklists/pci-scope.md` |
| Segregation of duties | The author does not approve their own change, and the deployer is neither the sole author nor the sole approver (gate G-FS-2). | PR approval and deployment records |
| Change ticket | Every production change links an approved ticket (gate G-FS-3). | PR description, `checklists/sox-change.md` |
| Money movement | Idempotent, append-only ledger, reconciled, exact decimals (gate G-FS-4). | `plan.md` "Money movement design" |
| Audit trail | Actor, action, target, time, outcome and origin; no account data in it. | `plan.md` "Audit trail design" |
| Payments | Strong customer authentication with dynamic linking; ISO 20022 conformance. | `plan.md`, `contracts/` |

The write-time gate blocks magnetic-stripe track data. A test that needs a documented synthetic
value is allowed by pattern id in `harness.secretsAllow` in `.specify/sdd-speckit.json`. Ask a
human to add that entry; do not add it yourself.
