<!-- @slot guardrails-items -->
- State whether the feature stores, processes or transmits account data. "None" is an answer;
  a blank is not (PCI DSS 12.5.2).
- State every amount with its currency, and say what must happen when a request is repeated,
  arrives late or arrives out of order.
- Use synthetic account numbers in examples. Never paste a real account number, card
  verification code or customer record into this document (PCI DSS 3.3.1, 6.5.5).

<!-- @slot edge-cases-items -->
- The same payment request arrives twice → the money moves once, and both callers get the same result.
- A payment times out with an unknown outcome → [expected behaviour: how the true state is found, and by whom]
- Authentication of the payer fails or is abandoned → no money moves, and the attempt is recorded (RTS (EU) 2018/389 Art. 4).
- The amount or the payee changes after the payer authenticated → the authentication is void (RTS (EU) 2018/389 Art. 5).
- A reconciliation finds a break between the ledger and the external record → [expected behaviour, owner, time limit]
- [NEEDS CLARIFICATION: what happens to a refund, reversal or chargeback of this movement?]

<!-- @slot nfr-rows -->
| NFR-FS-01 | Account data is stored only where the feature cannot work without it, and sensitive authentication data is never kept after authorisation. | PCI DSS v4.0.1 3.2.1, 3.3.1 | Cardholder data scope section; data inventory |
| NFR-FS-02 | A repeated or replayed request moves money exactly once. | Zero duplicate postings | Ledger against the external record |
| NFR-FS-03 | Every money movement and every access to account data leaves an audit record that cannot be altered. | PCI DSS v4.0.1 10.2.1, 10.3.2; SOX §404 ITGC | Audit trail |
| NFR-FS-04 | A payer-initiated electronic payment requires strong customer authentication linked to the amount and the payee, unless a recorded exemption applies. | PSD2 Art. 97; RTS (EU) 2018/389 Art. 5 | Authentication records |
| NFR-FS-05 | The ledger reconciles with [independent record]. | [Period; break tolerance: zero] | Reconciliation report |
| NFR-FS-06 | Payment messages exchanged with [scheme or counterparty] conform to the agreed message standard. | ISO 20022, [usage guideline and version] | Conformance test results |

<!-- @slot sections-after-requirements -->
## Cardholder data scope

Answer every row. This section decides which controls the plan must design for (PCI DSS 12.5.2).

| Question | Answer | Note |
|---|---|---|
| Does the feature **store** account data? | [yes / no] | [Which elements, why, for how long.] |
| Does the feature **process** account data? | [yes / no] | [Which elements, at which step.] |
| Does the feature **transmit** account data? | [yes / no] | [From whom, to whom.] |
| Does it touch sensitive authentication data (full track, card verification code, PIN)? | [yes / no] | [Never stored after authorisation — PCI DSS 3.3.1.] |
| Where does the feature sit? | [inside the cardholder data environment / connected to it / out of scope] | [Reason.] |
| Does a third party handle account data for this feature? | [yes / no] | [Who, and which requirements they own — PCI DSS 12.8.5.] |

**Scope verdict:** [in scope / out of scope] · **Confirmed by:** [Role, date]

## Money movements

| Movement | From → to | Currency | Initiated by | Payer authentication | Reversible by |
|---|---|---|---|---|---|
| [Name] | [Account type → account type] | [Code, or "multiple"] | [Payer / payee / system] | [Required / exempt: reason — RTS (EU) 2018/389 Art. 10–18 / not applicable] | [Refund / reversal / none] |

- **Financial reporting impact:** [yes / no]. If yes, the feature is in scope of SOX §404 IT
  general controls, and the change needs the evidence in the change-control checklist.
- **Regulatory regime:** [NEEDS CLARIFICATION: which jurisdictions and schemes apply to these movements?]

<!-- @slot review-checklist-items -->
- [ ] The cardholder data scope table has no blank answer, and the verdict names who confirmed it (PCI DSS 12.5.2)
- [ ] Every money movement states its currency, its initiator and what a repeat request does
- [ ] Each payer-initiated payment states strong customer authentication or the exemption relied on (PSD2 Art. 97)
- [ ] No real account number, card verification code or customer record appears in this document (PCI DSS 3.3.1, 6.5.5)
- [ ] Financial reporting impact is answered yes or no (SOX §404)
