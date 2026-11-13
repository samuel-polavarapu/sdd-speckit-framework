<!-- @slot sections-before-open-questions -->
## Tenancy

| Entity | Tenant-owned? | Tenant key | Scope enforced by | Note |
|---|---|---|---|---|
| [Entity] | [Yes / shared — reason] | `[field]` | [Mechanism from the plan's tenant isolation design (SOC 2 CC6.1).] | [Note.] |

- **Uniqueness:** [Which unique constraints are per tenant, not global, so that one tenant cannot detect another's data.]
- **Identifiers:** [Whether record ids are guessable across tenants. Authorization never relies on an id being secret (ASVS 5.0 V8).]

## Data classification and retention

One row per field that holds personal or confidential customer data. Every row maps to the spec's
personal-data inventory (GDPR Art. 30; SOC 2 C1.1).

| Entity.field | PD id | Classification | Protection | Retention | Deletion / export behaviour |
|---|---|---|---|---|---|
| `[Entity.field]` | [PD-01] | [Public / internal / confidential / personal / sensitive personal (GDPR Art. 9; CCPA §1798.121)] | [Encrypted at rest / field-level encryption / masked in logs (GDPR Art. 32)] | [Period, and what starts the clock (GDPR Art. 5(1)(e)).] | [Erased / anonymised / kept under legal basis; included in export or not (GDPR Art. 17, Art. 20).] |

- **Derived and copied data:** [Search indexes, caches, analytics stores, exports and backups that hold these fields, and how each follows the retention and deletion rules.]
- **Tenant offboarding:** [What is exported, what is deleted, by when, and the proof of deletion (SOC 2 C1.2).]
- **Non-production data:** [Synthetic or de-identified only. No copy of production personal data (GDPR Art. 5(1)(c), Art. 32).]
