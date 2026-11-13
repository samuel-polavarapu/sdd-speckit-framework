<!-- @slot sections-before-open-questions -->
## PHI classification

One row per field that is PHI or can identify a patient. Every element in the spec's PHI inventory
appears here, and nothing else does (HIPAA §164.502(b)).

| Entity.field | PHI class | Safe Harbor identifier type | Encrypted at rest | May appear in logs | Masking in non-production |
|---|---|---|---|---|---|
| `[Entity.field]` | [Identifier / health data / both / none] | [e.g. name, date, record number, or "—"] | [yes — mechanism] | no | [synthetic / removed / generalised] |
| `[Entity.field]` | [Class] | [Type] | [yes / no — reason] | [no / id only] | [Method] |

- **Free text:** [Fields that may hold PHI typed by a user, and how they are treated.]
- **Derived data:** [Indexes, caches, search documents, exports and backups that copy PHI, and their protection.]

## Retention, amendment and disposal

| Entity | Retention period | Basis | Amendment | Disposal method |
|---|---|---|---|---|
| [Entity] | [NEEDS CLARIFICATION: period — medical record retention is set by state law and contract, not by HIPAA] | [Law, contract or policy] | [How a correction is recorded without losing the original] (HIPAA §164.526) | [How it is made unreadable, including in backups] (HIPAA §164.310(d)(2)(i)) |
| Audit events | [NEEDS CLARIFICATION: period] | HIPAA §164.316(b)(2)(i) | Never amended | [Method] |

- **Disclosure accounting:** [Which entity records disclosures a patient can ask to see] (HIPAA §164.528).
- **Clinical history:** [Which records are versioned and never overwritten, and why.]
