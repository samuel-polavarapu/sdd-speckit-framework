<!-- @slot guardrails-items -->
- Name every personal data element the feature touches in the personal-data inventory below. If there is none, say so in that section; do not delete it.
- State who the customer (tenant) is in each scenario, and what a user of one tenant must never see of another.
- Name a regulation where it sets a requirement. Do not name a control implementation.

<!-- @slot edge-cases-items -->
- A user of tenant A requests a record that belongs to tenant B → the system answers as if the record does not exist, and records the attempt.
- A person asks for deletion while their data is under a legal hold or an open contract → [NEEDS CLARIFICATION: which data is kept, and on what basis? (GDPR Art. 17(3))]
- A person withdraws consent → processing that relied on it stops, and earlier lawful processing is unaffected (GDPR Art. 7(3)).
- A tenant is offboarded → [NEEDS CLARIFICATION: export window, deletion deadline and proof of deletion given to the customer]
- A user belongs to more than one tenant → [expected behaviour when they switch, and what carries over]

<!-- @slot nfr-rows -->
| NFR-GS-01 | No user, integration or staff member can read or change data of a tenant they are not authorised for (SOC 2 CC6.1). | Zero cross-tenant access | Negative isolation tests on every change |
| NFR-GS-02 | Each personal data element is processed only for its declared purpose and lawful basis (GDPR Art. 5(1)(b), Art. 6). | 100% of elements in the inventory | Privacy checklist; spec review |
| NFR-GS-03 | A data-subject request for access, correction, deletion or export is fulfilled within the legal time limit (GDPR Art. 12(3); CCPA §1798.130). | [Days — at most one month / 45 days] | Request log |
| NFR-GS-04 | Security-relevant and privileged actions leave an audit record that a tenant administrator or auditor can review (SOC 2 CC7.2). | [Retention period; time to retrieve] | Audit log review |
| NFR-GS-05 | Every user-facing view conforms to WCAG 2.2 level AA. | Zero level A or AA failures | Automated check and manual assistive-technology pass |
| NFR-GS-06 | The feature meets the service commitments made to customers for availability and recovery (SOC 2 A1.2). | [Availability %, recovery time, recovery point] | Service monitoring; recovery test |

<!-- @slot sections-after-requirements -->
## Personal data and lawful basis

List every personal data element the feature collects, derives, stores or shares. Write
"None — this feature processes no personal data" if that is the case (GDPR Art. 30; CCPA §1798.100).

| ID | Data element | Data subject | Purpose | Lawful basis (GDPR Art. 6) | Sensitive? | Retention | Shared with |
|---|---|---|---|---|---|---|---|
| PD-01 | [Element, in domain words.] | [Customer user / end customer / employee] | [Why it is needed.] | [Contract / consent / legitimate interest / legal obligation] | [No / special category (Art. 9) / sensitive PI (CCPA §1798.121)] | [Period, and what starts the clock.] | [Sub-processor or "none"] |
| PD-02 | [Element.] | [Subject.] | [Purpose.] | [NEEDS CLARIFICATION: lawful basis] | [No / yes] | [Period.] | [Recipient.] |

- **Role:** [Controller / processor / both, per data element. As processor, the customer's instructions bound the purpose (GDPR Art. 28(3)).]
- **Sale or sharing for advertising:** [None, or the opt-out the feature must honour (CCPA §1798.120).]

## Tenant boundary

- **Tenant:** [What one customer is in this feature: organisation, workspace, account.]
- **Tenant-owned data:** [Entities that belong to exactly one tenant.]
- **Shared data:** [Entities visible across tenants, and why that is safe. "None" is the default.]
- **Cross-tenant operations:** [None, or each one with who may perform it and how it is approved and logged (SOC 2 CC6.3).]
- **Staff access to tenant data:** [When support or operations staff may see it, and what the tenant is told.]

## Data-subject rights

State how each right is met for the data in the inventory, or why it does not apply.

| Right | Applies? | What the person or the tenant administrator can do | Time limit |
|---|---|---|---|
| Access / know (GDPR Art. 15; CCPA §1798.110) | [Yes / no — reason] | [Observable behaviour.] | [Days.] |
| Correction (GDPR Art. 16; CCPA §1798.106) | [Yes / no — reason] | [Observable behaviour.] | [Days.] |
| Deletion (GDPR Art. 17; CCPA §1798.105) | [Yes / no — reason] | [Observable behaviour, including what is kept and why.] | [Days.] |
| Portability (GDPR Art. 20) | [Yes / no — reason] | [Observable behaviour.] | [Days.] |
| Objection / opt-out (GDPR Art. 21; CCPA §1798.120) | [Yes / no — reason] | [Observable behaviour.] | [Days.] |

## Sub-processors

Third parties that will receive personal or customer data because of this feature (GDPR Art. 28(2); SOC 2 CC9.2).

| Sub-processor | Data received | Purpose | Region | New for this feature? |
|---|---|---|---|---|
| [Name, or "none".] | [PD ids.] | [Purpose.] | [Where the data is processed.] | [Yes — needs approval and customer notice / no] |

<!-- @slot review-checklist-items -->
- [ ] The personal-data inventory is complete, or states that there is no personal data (GDPR Art. 30)
- [ ] Every inventory row has a purpose, a lawful basis and a retention period (GDPR Art. 5, Art. 6)
- [ ] The tenant boundary section names every cross-tenant operation, or states "none" (SOC 2 CC6.1)
- [ ] Every data-subject right is answered "yes" with behaviour, or "no" with a reason (GDPR Art. 15–22; CCPA §1798.105–§1798.120)
- [ ] Every new sub-processor is listed and flagged for approval (GDPR Art. 28(2); SOC 2 CC9.2)
