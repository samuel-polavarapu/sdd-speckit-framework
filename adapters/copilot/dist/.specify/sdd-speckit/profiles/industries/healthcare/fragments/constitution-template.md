<!-- @slot principles -->
### Principle HC-1: Minimum necessary by design

A feature collects, shows, stores and discloses only the protected health information (PHI) its
stated purpose needs.

**Rationale:** Every extra identifier widens a breach and is hard to remove later. The Privacy Rule
makes minimum necessary a duty, not a preference (HIPAA §164.502(b)).

**In practice:** The spec has a PHI inventory with a purpose per element. A field with no purpose is
removed, not hidden.

### Principle HC-2: Patient safety outranks delivery

Software that can contribute to harm is classified, and the rigour of its design, verification and
change control follows the class.

**Rationale:** A defect in clinical logic reaches a patient before it reaches a bug tracker
(IEC 62304 §4.3).

**In practice:** The plan states the software safety class. Each requirement and risk control traces
to a passing test. Clinical rules are never guessed.

<!-- @slot gates-rows -->
| G-HC-1 | PHI inventory and minimum necessary | No feature that touches PHI merges without a PHI inventory in `spec.md` that gives each element a purpose and a minimum-necessary justification (HIPAA §164.502(b)). | `phi-handling` checklist; spec review |
| G-HC-2 | Audited PHI access | Every operation that creates, reads, changes, deletes or discloses PHI records an audit event, and a test proves it (HIPAA §164.312(b)). | Audit-trail tests in CI; `hipaa-safeguards` checklist |
| G-HC-3 | Safety class and traceability | The plan states the software safety class, and every requirement and risk control traces to at least one passing test (IEC 62304 §4.3, §5.1.1, §5.7). | Traceability matrix check in CI; analyze-phase report |
| G-HC-4 | No real PHI outside production | Development, test, demo and AI-assistant contexts hold only synthetic or de-identified data (HIPAA §164.514(a)–(b), §164.502(b)). | Write-time sensitive-data gate; de-identification test; PR review |

<!-- @slot quality-bar-items -->
- **PHI protection:** PHI is encrypted in transit and at rest; access is role-based with a unique
  user identity and automatic logoff (HIPAA §164.312(a), §164.312(e)). [PLACEHOLDER: approved algorithms and key custody]
- **Audit trail:** 100 % of PHI operations are audited; audit records are tamper-evident and are
  reviewed on a schedule (HIPAA §164.312(b), §164.308(a)(1)(ii)(D)). [NEEDS CLARIFICATION: retention period and review cadence]
- **Interoperability:** Health information is exchanged as HL7 FHIR R4 (4.0.1) resources that pass
  validation against [PLACEHOLDER: implementation guide and version].
- **Software safety:** Each software item has a safety class A, B or C, and the lifecycle activities
  match the class (IEC 62304 §4.3). [PLACEHOLDER: "not medical device software", with the recorded determination]
- **Traceability:** Requirement → design → test → risk control links are complete and are checked
  by machine on every pull request (IEC 62304 §5.1.1, §7.3).

<!-- @slot governance-items -->
- **Compliance ownership:** [ROLE: privacy officer] and [ROLE: security officer] approve any change
  to a G-HC gate or to Annex R (HIPAA §164.308(a)(2), §164.530(a)).
- **Business associates:** No third party creates, receives, maintains or transmits PHI for the
  project before a business associate agreement is signed and listed in [PLACEHOLDER: register]
  (HIPAA §164.308(b)(1), §164.502(e), §164.504(e)).
- **Incident and breach:** A suspected PHI incident goes to [ROLE] at once. Notification timing
  follows the breach rule: without unreasonable delay, and no later than 60 calendar days after
  discovery (HIPAA §164.308(a)(6), §164.404, §164.410).
- **Risk analysis:** The security risk analysis is updated when a feature adds a PHI store, a PHI
  flow or a third party (HIPAA §164.308(a)(1)(ii)(A), §164.308(a)(8)).
- **Record keeping:** Policies, risk decisions and waivers are kept six years (HIPAA §164.316(b)(2)(i)).

<!-- @slot annexes -->
## Annex R — Regulatory controls (Healthcare and life sciences)

| Standard / control | What the project must do | Evidenced in |
|---|---|---|
| HIPAA §164.308(a)(1) Security management | Keep a risk analysis current; review system activity records. | Plan risks and threat model; audit review log |
| HIPAA §164.308(a)(4) Information access management | Grant PHI access by role and need; record who approves it. | Plan access matrix; `hipaa-safeguards` checklist |
| HIPAA §164.308(b)(1), §164.504(e) Business associates | Sign an agreement before a third party handles PHI. | Agreement register; `privacy` checklist |
| HIPAA §164.312(a) Access control | Unique user id, emergency access, automatic logoff, encryption at rest. | Plan safeguards section; access-control tests |
| HIPAA §164.312(b) Audit controls | Record and examine activity in systems that hold PHI. | Plan audit trail design; audit-trail tests |
| HIPAA §164.312(c)–(e) Integrity, authentication, transmission | Detect improper alteration; authenticate people and systems; encrypt PHI in transit. | Plan safeguards section; `security` checklist |
| HIPAA §164.502(b), §164.514(d) Minimum necessary | Limit PHI used, disclosed and requested to what the purpose needs. | Spec PHI inventory; `phi-handling` checklist |
| HIPAA §164.514(a)–(b) De-identification | Use Safe Harbor or Expert Determination before data leaves production. | Plan de-identification section; de-identification test |
| HIPAA §164.400–414 Breach notification | Detect, assess and notify within the rule's time limits. | Incident runbook; `release` checklist |
| HL7 FHIR R4 (4.0.1) | Exchange health information as conformant resources; publish what the system supports. | `contracts/`; conformance tests |
| IEC 62304 §4.3 Safety classification | Assign class A, B or C to each software item, with the rationale. | Spec safety section; plan technical context |
| IEC 62304 §5, §7, §8, §9 Lifecycle | Plan, trace, verify, manage risk, control configuration and resolve problems to the depth the class needs. | Traceability matrix; `tasks.md`; release record |

This annex is engineering guidance. It is not legal or compliance advice. The organisation's
compliance owner must confirm each mapping, and whether each standard applies, before the project
relies on it.
