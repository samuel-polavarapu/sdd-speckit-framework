<!-- @slot technical-context-extra-rows -->
| Tenancy model | [Shared schema with tenant key / schema per tenant / database per tenant — and why] |
| Tenant context source | [Where the tenant identity comes from on each request, job and event. Never caller input.] |
| Data residency | [Regions where tenant and personal data may be stored and processed (GDPR Art. 44)] |
| Security verification level | [OWASP ASVS 5.0 Level 1 / 2 / 3] |
| Audit log store | [Where audit records go, who can read them, retention (SOC 2 CC7.2)] |

<!-- @slot constitution-check-rows -->
| G-GS-1 Tenant isolation | [PASS / FAIL] | [Isolation mechanism, and the negative cross-tenant tests that prove it.] |
| G-GS-2 Personal data declared | [PASS / FAIL / N/A] | [Every field in `data-model.md` maps to a row of the spec's personal-data inventory.] |
| G-GS-3 Change evidence | [PASS / FAIL] | [Change request link, approver role, rollback path.] |

<!-- @slot test-strategy-extra-rows -->
| Tenant isolation | Each new access path, called as tenant A against tenant B's data: read, write, list, search, export | [Tool.] | Zero cross-tenant result; runs on every pull request (SOC 2 CC6.1) |
| Authorization | Each role against each operation, including object-level checks (ASVS 5.0 V8) | [Tool.] | Every denied case in the role matrix is denied |
| Data-subject rights | Access, correction, deletion and export for one person, end to end, including backups and sub-processors (GDPR Art. 15–20) | [Tool.] | Every element in the inventory is covered |
| Accessibility | New or changed views against WCAG 2.2 level AA | [Automated tool and manual assistive-technology pass] | Zero level A or AA failure |
| Security scan | Static analysis, dependency scan, secret scan (SOC 2 CC7.1) | [Tool.] | No high or critical finding without a recorded exception |

<!-- @slot risks-rows -->
| R-GS-1 | A query, cache key, background job or search index omits the tenant scope and returns another tenant's data (SOC 2 CC6.1). | [L/M/H] | H | [Enforce scope in one shared layer; negative tests; owner.] |
| R-GS-2 | Personal data reaches logs, analytics, error reports or a sub-processor outside the inventory (GDPR Art. 5(1)(c), Art. 28). | [L/M/H] | H | [Redaction at the logging boundary; review of outbound payloads; owner.] |
| R-GS-3 | A deletion request leaves copies in backups, caches, exports or a sub-processor (GDPR Art. 17). | [L/M/H] | M | [Deletion fan-out design; backup expiry; owner.] |
| R-GS-4 | A change reaches production without recorded approval or test evidence, and the audit sample fails (SOC 2 CC8.1). | [L/M/H] | M | [Branch protection; `soc2-change` checklist; owner.] |
| R-GS-5 | One tenant's load degrades service for others (SOC 2 A1.1). | [L/M/H] | M | [Per-tenant quotas and limits; owner.] |

<!-- @slot rollout-items -->
- **Change record:** [Link to the change request. Complete the `soc2-change` checklist before the production deployment (SOC 2 CC8.1).]
- **Tenant rollout:** [All tenants, or staged by tenant cohort. Name the internal or pilot tenants that go first.]
- **Customer notice:** [None, or what customers are told and when: new sub-processor, changed data use, breaking change (GDPR Art. 28(2); SOC 2 CC2.3).]

<!-- @slot sections-before-open-questions -->
## Threat model (STRIDE)

One row per threat that applies to a trust boundary this feature adds or changes. Mark a category
"not applicable" with the reason; do not delete it (GDPR Art. 25, Art. 32; ASVS 5.0 V15).

**Trust boundaries:** [e.g. browser ↔ API, API ↔ data store, service ↔ sub-processor, tenant ↔ tenant, staff tooling ↔ production]

| Category | Threat in this feature | Asset / boundary | Mitigation | Verified by |
|---|---|---|---|---|
| Spoofing | [e.g. a caller presents another tenant's identifier or a forged token.] | [Boundary.] | [Control. (ASVS 5.0 V6, V7, V9)] | [Test or review.] |
| Tampering | [e.g. a request body changes an owner or tenant field.] | [Boundary.] | [Control. (ASVS 5.0 V2, V8)] | [Test or review.] |
| Repudiation | [e.g. an administrator denies an export or a permission change.] | [Boundary.] | [Audit record. (ASVS 5.0 V16; SOC 2 CC7.2)] | [Test or review.] |
| Information disclosure | [e.g. cross-tenant read through a list, search, cache or error message.] | [Boundary.] | [Control. (SOC 2 CC6.1; ASVS 5.0 V8, V14)] | [Test or review.] |
| Denial of service | [e.g. one tenant exhausts a shared resource.] | [Boundary.] | [Quota or limit. (SOC 2 A1.1)] | [Test or review.] |
| Elevation of privilege | [e.g. a member reaches a tenant-administrator or staff operation.] | [Boundary.] | [Control. (SOC 2 CC6.3; ASVS 5.0 V8)] | [Test or review.] |

## Tenant isolation design

- **Isolation mechanism:** [How the tenant scope is enforced at the data layer, in one place, so that a missing filter fails closed (SOC 2 CC6.1).]
- **Tenant context propagation:** [How the tenant identity travels from the authenticated session into requests, background jobs, events and scheduled work.]
- **Shared resources:** [Caches, queues, search indexes, object storage, logs: how each is keyed or partitioned per tenant.]
- **Cross-tenant and staff access:** [Each allowed path, its approval, its time limit and its audit record (SOC 2 CC6.3). "None" is the default.]
- **Encryption and keys:** [In transit and at rest; per-tenant keys or not, and why (SOC 2 CC6.1, CC6.7; ASVS 5.0 V11).]
- **Noisy-neighbour limits:** [Per-tenant quotas, rate limits and timeouts (SOC 2 A1.1).]

| Access path | Tenant scope enforced by | Negative test |
|---|---|---|
| [Endpoint, job, event consumer, export or report.] | [Mechanism.] | `[test path]` |

## Personal data handling

- **Inventory mapping:** [Each PD id from the spec → the fields that hold it in `data-model.md`.]
- **Deletion and export path:** [How a request reaches every store, cache, backup and sub-processor, and how completion is proved (GDPR Art. 15, Art. 17, Art. 20; CCPA §1798.105).]
- **Retention enforcement:** [The job or rule that removes data at the end of its period (GDPR Art. 5(1)(e); SOC 2 C1.2).]
- **Sub-processor data flows:** [What is sent to each one, how it is minimised, and the agreement that covers it (GDPR Art. 28).]
- **Impact assessment:** [Done, or not needed with the reason (GDPR Art. 35).]

## Audit trail design

| Event | Fields recorded | Visible to | Retention |
|---|---|---|---|
| [Sign-in, permission change, export, deletion, staff access to tenant data, configuration change.] | [Actor, tenant, action, target, time, outcome. No secret and no personal data beyond the actor id.] | [Tenant administrator / internal only] | [Period (SOC 2 CC7.2).] |

- **Integrity:** [How records are protected from change or deletion, including by administrators (ASVS 5.0 V16).]

<!-- @slot artifacts-items -->
- [ ] `checklists/soc2-change.md`
- [ ] `checklists/privacy.md`
