<!-- @slot identity-rows -->
| C-FS-01 | Access to account data and to ledger operations is granted by role on a need-to-know basis, with least privilege (PCI DSS 7.2.1, 7.2.2; SOX §404 ITGC — access). | [ ] | |
| C-FS-02 | Every non-console path into the cardholder data environment requires multi-factor authentication (PCI DSS 8.4.2). | [ ] | |
| C-FS-03 | A payer-initiated electronic payment requires strong customer authentication with two independent factors (PSD2 Art. 97; RTS (EU) 2018/389 Art. 4, 9). | [ ] | |
| C-FS-04 | The authentication code is bound to the amount and the payee, and a change to either voids it (RTS (EU) 2018/389 Art. 5). | [ ] | |

<!-- @slot input-rows -->
| C-FS-05 | Every inbound payment message is validated against its ISO 20022 schema and the usage guideline before any posting. | [ ] | |
| C-FS-06 | Amounts are parsed into an exact decimal type with an explicit currency, and a negative, zero or over-precise amount is rejected where the rule says so. | [ ] | |
| C-FS-07 | Every script loaded on a payment page is authorised, integrity-checked and inventoried with its justification (PCI DSS 6.4.3). | [ ] | |

<!-- @slot data-rows -->
| C-FS-08 | No sensitive authentication data (full track, card verification code, PIN) is stored after authorisation, in any store, log or queue (PCI DSS 3.3.1). | [ ] | |
| C-FS-09 | Every stored account number is unreadable at rest, and the plan names the method and the key custody (PCI DSS 3.5.1, 3.6.1). | [ ] | |
| C-FS-10 | An account number is masked wherever it is displayed, and only roles with a business need see more (PCI DSS 3.4.1). | [ ] | |
| C-FS-11 | Account data crossing an open or public network uses strong cryptography (PCI DSS 4.2.1). | [ ] | |

<!-- @slot supply-chain-rows -->
| C-FS-12 | Bespoke and third-party software components are inventoried so that vulnerabilities can be tracked (PCI DSS 6.3.2). | [ ] | |
| C-FS-13 | Every change is reviewed before release by someone other than its author (PCI DSS 6.2.3.1). | [ ] | |
| C-FS-14 | Each third party that handles account data is listed with the requirements it is responsible for (PCI DSS 12.8.1, 12.8.5). | [ ] | |

<!-- @slot sections-before-result -->
## Payment integrity and audit trail

| # | Item | Status | Note |
|---|---|---|---|
| C-FS-15 | Every operation that moves money takes an idempotency key, and a test proves a repeat posts once (constitution gate G-FS-4). | [ ] | |
| C-FS-16 | The ledger has no update and no delete path, and the application's own credentials cannot alter a posted entry. | [ ] | |
| C-FS-17 | Every money movement, account data access and privileged action writes an audit record with actor, action, target, time, outcome and origin (PCI DSS 10.2.1, 10.2.2). | [ ] | |
| C-FS-18 | Audit records are protected from modification, and a change to them would be detected (PCI DSS 10.3.2, 10.3.4). | [ ] | |
