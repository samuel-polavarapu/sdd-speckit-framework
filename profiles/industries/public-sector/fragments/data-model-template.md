<!-- @slot sections-before-open-questions -->
## Data classification and records

One row per field or field group that holds government or personal data. The impact values come
from the security categorisation in `spec.md` (FIPS 199).

| Entity.field | Information type | Sensitivity | C / I / A | Protection at rest | Appears in logs |
|---|---|---|---|---|---|
| `[Entity.field]` | [Type from the spec.] | [Public / internal / PII / CUI] | [L/M/H] / [L/M/H] / [L/M/H] | [Mechanism, validated module.] (NIST SC-28) | [never / masked / yes] |

**Rules**

- A field marked PII or CUI is never written to a log, an error message or an analytics event (NIST AU-3, SI-11).
- Non-production data sets hold no real PII (NIST SI-12(2)).
- Collect only the fields the stated purpose needs. Justify each optional sensitive field (NIST SI-12(1)).

## Records retention and disposition

| Entity | Record type | Records schedule item | Retention | Disposition | Legal hold |
|---|---|---|---|---|---|
| [Entity] | [Federal record / non-record / audit record] | [Schedule and item, or NEEDS CLARIFICATION] | [Period, and the event that starts it.] | [Destroy / transfer to archives], by [job or step] (NIST SI-12) | [How a hold stops disposition.] |

- **Audit records:** kept for [period], then [disposition] (NIST AU-11).
- **Backups and replicas:** follow the same retention and residency as the primary store.

## Residency and location

| Store | Data held | Region or facility | Inside the authorisation boundary | Replicated to |
|---|---|---|---|---|
| [Store.] | [Entities.] | [Location.] | [yes / no] | [Location, or "none".] (NIST SC-7, SA-9) |
