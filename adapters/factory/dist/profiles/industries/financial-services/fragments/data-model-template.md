<!-- @slot sections-before-open-questions -->
## Account data classification

List every field that holds, or is derived from, account data. Write "none" if there is none.

| Entity.field | Class | Stored | Protection | Shown as | Retention |
|---|---|---|---|---|---|
| `[Entity.field]` | [Account number / cardholder name / expiry / service code / token / not account data] | [yes / no] | [Unreadable at rest: method — PCI DSS 3.5.1] | [Masked: at most the BIN and the last four digits — PCI DSS 3.4.1] | [Period and disposal — PCI DSS 3.2.1] |
| `[Entity.field]` | [Sensitive authentication data: full track / card verification code / PIN] | never after authorisation | [Not persisted — PCI DSS 3.3.1] | never | none |

- **Tokens:** [Which fields hold a token in place of an account number, who issues it, and
  whether the token can be reversed inside this system.]
- **Derived copies:** [Search indexes, caches, exports, backups and analytics stores that
  receive any field above. Each one is in scope.]

## Money and ledger rules

| Entity.field | Money type | Currency field | Rounding | Mutable |
|---|---|---|---|---|
| `[Entity.amount]` | [Exact decimal (precision, scale) or integer minor units] | `[Entity.currency]` | [Rule] | [no — append only] |

- **Double entry:** [Every posting has balanced debit and credit entries. State the invariant.]
- **Immutability:** Ledger entries have no update and no delete path. A correction is a new
  entry with a reference to the original. Enforced at: [store permission, constraint or trigger].
- **Idempotency key:** `[Entity.field]`, unique within [scope], kept for [period].
- **Audit fields:** [Who created the record, when, from which request and under which change
  ticket (PCI DSS 10.2.2; SOX §404 ITGC).]
- **Retention:** [Period for ledger and audit records.]
  [NEEDS CLARIFICATION: which statutory retention period applies in each jurisdiction?]
