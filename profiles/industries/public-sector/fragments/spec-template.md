<!-- @slot guardrails-items -->
- State the information types the feature handles and their impact levels. Do not state the
  controls that protect them; control selection belongs in `plan.md` (FIPS 199).
- Name the regulation or control family a requirement comes from. Do not name a product, a vendor
  or a hosting service.
- Treat every user-facing behaviour, document and notification as in scope for Section 508.

<!-- @slot edge-cases-items -->
- A user relies on assistive technology or the keyboard alone → every step of the primary story completes (Section 508, WCAG 2.0 AA)
- A session is idle past the limit, or a user's access is revoked mid-task → [expected behaviour] (NIST AC-2, AC-12)
- An audit record cannot be written → [NEEDS CLARIFICATION: does the action stop, or continue with an alert?] (NIST AU-5)
- A record reaches the end of its retention period while it is under a legal hold → [expected behaviour] (NIST SI-12)
- A request arrives from outside the permitted geography or network → [expected behaviour] (NIST SC-7)

<!-- @slot nfr-rows -->
| NFR-PS-01 | Information is protected at the level its security categorisation requires. | [Low / Moderate / High] baseline (FIPS 199; FedRAMP Rev. 5) | Control assessment |
| NFR-PS-02 | Every security-relevant action is recorded with who, what, when, where and outcome, and the record cannot be altered by the actor. | 100% of the events listed in this spec (NIST AU-2, AU-3, AU-9) | Audit record review |
| NFR-PS-03 | Government data is stored and processed only inside the authorisation boundary and the permitted jurisdiction. | [Jurisdiction] only (NIST SC-7, SA-9) | Boundary review |
| NFR-PS-04 | Cryptographic protection of government data uses validated modules. | FIPS 140-3 validated, approved mode (NIST SC-13) | Cryptography inventory |
| NFR-PS-05 | User interfaces, electronic content and support material are accessible. | Revised Section 508; WCAG 2.0 Level AA | Accessibility conformance report |
| NFR-PS-06 | Records are retained and disposed of according to the approved schedule. | [Schedule id and period] (NIST SI-12, AU-11) | Records review |

<!-- @slot sections-after-requirements -->
## Security categorisation (FIPS 199)

One row per information type the feature creates, reads, changes or transmits. Impact is the
effect of a loss on the organisation or on individuals: **Low**, **Moderate** or **High**.

| Information type | Source or reference | Confidentiality | Integrity | Availability | Rationale |
|---|---|---|---|---|---|
| [Type, e.g. benefit application] | [NIST SP 800-60 type, or agency catalogue] | [L / M / H] | [L / M / H] | [L / M / H] | [Why.] |
| [Type] | [Reference.] | [L / M / H] | [L / M / H] | [L / M / H] | [Why.] |

- **Feature impact level:** [Low / Moderate / High] — the highest value in the table.
- **System impact level today:** [Low / Moderate / High]. Does this feature raise it?
  [No / NEEDS CLARIFICATION: yes — the system owner must decide before the plan phase]
- **Sensitive categories present:** [None / personally identifiable information / controlled
  unclassified information / other], with the authority that defines each.
- **Approved by:** [ROLE: system owner or information owner], [date].

## Boundary, residency and records

State what must be true. The plan states how.

| Topic | Requirement |
|---|---|
| Authorisation boundary | [Inside the existing boundary / extends it / NEEDS CLARIFICATION] |
| External parties that send or receive data | [Party, data exchanged, agreement that covers it — or "none"] |
| Data residency | [Jurisdiction where data may be stored, processed and supported from] |
| Who may access | [Roles, and any citizenship, clearance or location condition] |
| Records created | [Record type, records schedule item, retention period, disposition] |
| Public notice | [System use notification, privacy notice or records notice needed — or "none"] |

<!-- @slot review-checklist-items -->
- [ ] Every information type has a confidentiality, integrity and availability impact, and a rationale (FIPS 199)
- [ ] The categorisation is approved by the system owner, by name and date (NIST RA-2)
- [ ] The spec says whether the feature changes the authorisation boundary or adds an external connection
- [ ] Data residency and access conditions are stated, not assumed
- [ ] Each record type has a schedule item and a retention period (NIST SI-12)
- [ ] The events that must be audited are listed (NIST AU-2)
- [ ] Accessibility is a requirement for every user-facing scenario, including documents and notifications (Section 508)
