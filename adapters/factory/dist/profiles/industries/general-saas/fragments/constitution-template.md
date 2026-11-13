<!-- @slot principles -->
### Principle GS-1: Tenant isolation by construction

One tenant never reads, changes or infers another tenant's data, and the design makes the wrong
access impossible, not merely unlikely.

**Rationale:** A cross-tenant leak is the failure a B2B customer does not forgive, and it is a
reportable breach when personal data is involved (SOC 2 CC6.1, GDPR Art. 32).

**In practice:** Every data access path carries the tenant identity from the authenticated session,
never from caller input. A negative cross-tenant test exists for each new access path.

### Principle GS-2: Personal data is declared before it is collected

No personal data element is collected, derived or shared until the spec names its purpose and its
lawful basis.

**Rationale:** An undeclared element has no retention period, no deletion path and no answer to a
data-subject request (GDPR Art. 5(2), Art. 6, Art. 30).

**In practice:** The spec's personal-data inventory lists every element. A field in the data model
that is not in the inventory is a defect.

<!-- @slot gates-rows -->
| G-GS-1 | Tenant isolation | Every new or changed data access path is scoped to the caller's tenant, and a negative cross-tenant test proves it (SOC 2 CC6.1, ASVS 5.0 V8). | Plan tenant-isolation section; cross-tenant test in CI |
| G-GS-2 | Personal data declared | Every personal data element has a purpose, a lawful basis, a retention period and a deletion path before implementation starts (GDPR Art. 5, Art. 6, Art. 30; CCPA §1798.100). | Spec personal-data inventory; privacy checklist |
| G-GS-3 | Change evidence | Every production change has a linked request, a passing test record, an approval by someone other than the author, and a rollback path (SOC 2 CC8.1). | `soc2-change` checklist; PR approval record |

<!-- @slot quality-bar-items -->
- **Tenant isolation:** Zero cross-tenant access in the negative test suite. The suite runs on every pull request (SOC 2 CC6.1).
- **Application security baseline:** OWASP ASVS 5.0 Level [PLACEHOLDER: 1 / 2 / 3]. [NEEDS CLARIFICATION: which level does the customer contract or the SOC 2 scope require?]
- **Accessibility baseline:** WCAG 2.2 level AA for every user-facing view.
- **Data-subject requests:** Answered within [PLACEHOLDER: days — at most one month under GDPR Art. 12(3), 45 days under CCPA §1798.130].
- **Audit logging:** Every privileged action and every access to tenant data by staff is logged and kept for [PLACEHOLDER: retention period] (SOC 2 CC7.2).

<!-- @slot governance-items -->
- **Compliance owner:** [ROLE] confirms the regulatory mapping in Annex R and reviews it at each review cadence and when a listed standard changes.
- **Sub-processor register:** [ROLE] owns the list of sub-processors. A new sub-processor needs approval and customer notice before it receives personal data (GDPR Art. 28(2), SOC 2 CC9.2).
- **Audit evidence:** Change, access-review and incident records are kept for [PLACEHOLDER: period covering the SOC 2 audit window] in [PLACEHOLDER: system of record].
- **Gate waivers:** A waiver of G-GS-1, G-GS-2 or G-GS-3 also needs the compliance owner's approval.

<!-- @slot annexes -->
## Annex R — Regulatory controls (General SaaS / B2B software)

| Standard / control | What the project must do | Evidenced in |
|---|---|---|
| SOC 2 CC6.1–CC6.3 (logical access) | Enforce authentication, least privilege and tenant scoping on every access path. Review access on a schedule. | Plan tenant-isolation section; security checklist; access-review records |
| SOC 2 CC7.2–CC7.4 (monitoring and incidents) | Log security-relevant events, alert on anomalies, and follow the incident process. | Plan monitoring items; runbook; incident records |
| SOC 2 CC8.1 (change management) | Authorise, test, approve and document every change, with a rollback path. | `soc2-change` checklist; PR record; deployment log |
| SOC 2 CC9.2 (vendor risk) | Assess each vendor and sub-processor before use, and keep the register current. | Sub-processor register; spec sub-processor section |
| OWASP ASVS 5.0 (V6 Authentication, V7 Session Management, V8 Authorization, V14 Data Protection, V16 Security Logging and Error Handling) | Verify the feature against the chosen ASVS level. | Security checklist; test strategy |
| GDPR Art. 5, Art. 6, Art. 30 | State purpose, lawful basis and retention for each personal data element. Keep the record of processing current. | Spec personal-data inventory; data-model classification |
| GDPR Art. 15–22; CCPA §1798.105, §1798.106, §1798.110, §1798.120 | Support access, correction, deletion, portability, objection and opt-out requests within the legal time limit. | Spec data-subject rights section; regulatory tasks |
| GDPR Art. 25, Art. 32, Art. 35 | Apply data protection by design, appropriate security, and an impact assessment where the risk is high. | Plan threat model; privacy checklist |
| GDPR Art. 28, Art. 44–46 | Use processors under contract only, and transfer personal data outside the allowed regions only with a valid transfer mechanism. | Sub-processor register; privacy checklist |
| GDPR Art. 33; CCPA §1798.150 | Detect a personal-data breach and notify within the legal time limit (72 hours to the authority under GDPR). | Runbook; incident records |
| WCAG 2.2 level AA | Meet every level A and AA success criterion in user-facing views. | Accessibility checklist; automated check in CI |

This annex is engineering guidance, not legal or compliance advice. The organisation's compliance
owner must confirm the mapping, the scope and every time limit before the project relies on it.
