<!-- @slot principles -->
### Principle PS-1: Categorise, then control

The security categorisation of the information decides the control baseline, and the baseline
decides the design.

**Rationale:** A feature designed before its impact level is known is either over-built or cannot
be authorised. Rework after assessment costs more than categorising first (FIPS 199, NIST RA-2).

**In practice:** The spec carries a categorisation table. The plan maps each applicable control to
an implementation or to a named inherited provider. No control is "assumed".

### Principle PS-2: Evidence is a deliverable

A control that cannot be shown to an assessor is treated as not implemented.

**Rationale:** Authorisation rests on evidence, not on intent. Evidence gathered after the fact is
incomplete and delays the authorisation decision (NIST SA-11, AU-12).

**In practice:** Each control row in the plan names its evidence: a test, a configuration file, a
log sample or a document. The evidence is produced by the pipeline, not by hand.

<!-- @slot gates-rows -->
| G-PS-1 | Categorise before design | The spec has a FIPS 199 categorisation (confidentiality, integrity, availability) approved by [ROLE: system owner] before the plan phase starts. | Categorisation section of `spec.md`; plan constitution check |
| G-PS-2 | Controls are traced | Every applicable NIST SP 800-53 control the feature touches is marked implemented, inherited or planned in the plan, with its evidence. No row is blank. | Control implementation summary in `plan.md`; `ato-readiness` checklist |
| G-PS-3 | Validated cryptography only | Cryptography that protects government data uses a FIPS 140-3 validated module in its approved mode. No custom or unvalidated algorithm (NIST SC-13). | Cryptography inventory in `plan.md`; security checklist |
| G-PS-4 | Section 508 conformance | No user-facing change, document or support material merges with an open WCAG 2.0 Level AA failure, unless a recorded exception exists (36 CFR 1194, E205, E207). | `section-508` checklist; accessibility test run in CI |

<!-- @slot quality-bar-items -->
- **Control baseline:** [PLACEHOLDER: FedRAMP Rev. 5 Low / Moderate / High, or agency baseline], set
  by the FIPS 199 categorisation (NIST RA-2).
- **Accessibility conformance:** Revised Section 508 Standards, WCAG 2.0 Level AA as the floor. An
  accessibility conformance report is kept current for each release.
- **Cryptography:** FIPS 140-3 validated modules only, for data in transit, at rest and for
  authentication (NIST SC-8, SC-13, SC-28, IA-7).
- **Audit logging:** Every security-relevant event is recorded with the content NIST AU-3 requires,
  and kept for [NEEDS CLARIFICATION: audit retention period] (NIST AU-11).
- **Vulnerability remediation:** Findings are fixed within [NEEDS CLARIFICATION: remediation window
  per severity, from the authorising programme] (NIST RA-5, SI-2).
- **Supply chain:** Every build produces a software bill of materials. No unsupported component
  ships (NIST CM-8, SA-22).

<!-- @slot governance-items -->
- **Authorising official:** [ROLE] accepts residual risk. No engineer or AI agent accepts risk on
  the organisation's behalf.
- **Significant change:** A change to the authorisation boundary, the categorisation, an external
  connection or a cryptographic module is assessed for security impact before it merges, and is
  reported to [ROLE: ISSO] (NIST CM-3, CM-4).
- **Deviations:** A control that is not met is recorded in the plan of action and milestones with
  an owner and a date. A waiver in this document does not replace that record.
- **Records:** Project artifacts that are federal records follow the schedule named in
  [PLACEHOLDER: records schedule] (NIST SI-12).

<!-- @slot annexes -->
## Annex R — Regulatory controls (Public sector and government)

| Standard / control | What the project must do | Where it is evidenced |
|---|---|---|
| FIPS 199; NIST RA-2 | Categorise each information type for confidentiality, integrity and availability impact. Derive the system impact level. | `spec.md` security categorisation section |
| FedRAMP Rev. 5 baseline; NIST RA-3 | Select the baseline that matches the impact level. Assess risk for every change to it. | Constitution Article III; `plan.md` risks |
| NIST AC-2, AC-3, AC-6 | Manage accounts, enforce authorisation on every request and grant least privilege. | `plan.md` control implementation summary; security checklist |
| NIST IA-2, IA-5, IA-8 | Identify and authenticate organisational and public users. Use multi-factor authentication where the baseline requires it. | `plan.md` control implementation summary; integration tests |
| NIST AU-2, AU-3, AU-9, AU-11, AU-12 | Log the defined events with the required content. Protect and retain the records. | `plan.md` audit and records design; log samples |
| NIST SC-7, SC-8, SC-28 | Keep data inside the authorisation boundary. Protect it in transit and at rest. | `plan.md` authorisation boundary section; `data-model.md` |
| FIPS 140-3; NIST SC-12, SC-13, IA-7 | Use validated cryptographic modules in approved mode. Manage keys. | `plan.md` cryptography inventory, with certificate numbers |
| NIST CM-2, CM-3, CM-6, CM-8 | Keep a configuration baseline in version control. Control change. Keep a component inventory. | Repository history; software bill of materials per build |
| NIST SA-10, SA-11, SA-15, SA-22 | Manage developer configuration. Test and scan in the pipeline. Ship no unsupported component. | CI records; `tasks.md` regulatory tasks |
| NIST RA-5, SI-2, SI-4, SI-10 | Scan for vulnerabilities. Remediate in the set window. Monitor. Validate input. | Scan reports; plan of action and milestones |
| NIST SI-12; agency records schedule | Retain and dispose of information according to the approved records schedule. | `data-model.md` classification and records table |
| Section 508 (36 CFR 1194) | Conform to WCAG 2.0 Level AA for user interfaces, electronic content and support documentation. | `section-508` checklist; accessibility conformance report |

This annex is engineering guidance. It is not legal or compliance advice. The organisation's
compliance owner (for example the ISSO or the authorising official's representative) must confirm
the baseline, the control selection and each interpretation before the project relies on it.
