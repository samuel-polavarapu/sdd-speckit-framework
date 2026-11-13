<!-- @slot guardrails-items -->
- List every element of protected health information (PHI) the feature touches in the PHI inventory
  below. An element with no purpose is out of scope (HIPAA §164.502(b)).
- Describe an exchange with another system by the information exchanged and why. Resource types,
  transports and endpoints belong in `plan.md`.
- Never write a clinical rule, threshold, unit or dose from memory. Cite its source, or mark it
  `[NEEDS CLARIFICATION]`.
- Use only invented patients in examples. No real name, record number or date of service.

<!-- @slot edge-cases-items -->
- A clinician needs a record outside their normal access in an emergency → [expected behaviour, and what is recorded] (HIPAA §164.312(a)(2)(ii))
- A patient asks for a copy, a correction or a list of disclosures of their data → [expected behaviour] (HIPAA §164.524, §164.526, §164.528)
- A patient has restricted a disclosure, or a record carries extra legal protection → [expected behaviour] (HIPAA §164.522)
- Another system sends incomplete, duplicate or conflicting clinical information → [expected behaviour]
- The system is unavailable while care is in progress → [fallback, and how data is reconciled] (HIPAA §164.308(a)(7))

<!-- @slot nfr-rows -->
| NFR-HC-01 | Only people and systems with a stated need can see or change PHI, and each acts under its own identity. | HIPAA §164.312(a)(1), §164.312(d) | [Access review; access tests.] |
| NFR-HC-02 | Every creation, view, change, deletion and disclosure of PHI is recorded with who, what, which patient and when. | HIPAA §164.312(b); 100 % of PHI operations | [Audit trail tests.] |
| NFR-HC-03 | PHI is unreadable to anyone without authorisation, in storage and in transit. | HIPAA §164.312(a)(2)(iv), §164.312(e)(1) | [Security review.] |
| NFR-HC-04 | The feature uses and discloses the minimum PHI necessary for its purpose. | HIPAA §164.502(b) | [PHI inventory review.] |
| NFR-HC-05 | Information exchanged with other systems conforms to the agreed health-data standard. | HL7 FHIR R4 (4.0.1); zero conformance error | [Conformance tests.] |
| NFR-HC-06 | Every requirement that bears on patient safety is verified, and the link is recorded. | IEC 62304 §5.7, class [A / B / C] | [Traceability matrix.] |

<!-- @slot sections-after-requirements -->
## PHI inventory

One row per element. "Identifier" means one of the 18 Safe Harbor identifier types
(HIPAA §164.514(b)(2)). If the feature touches no PHI, write "None" and the reason.

| Element | Identifier type or health data | Purpose | Minimum necessary justification | Who may see it | Source and recipients |
|---|---|---|---|---|---|
| [e.g. date of birth] | [Identifier: date / Health data / Both] | [Why the feature needs it.] | [Why less would not do.] | [Roles.] | [From → to.] |
| [Element] | [Type] | [Purpose.] | [Justification.] | [Roles.] | [From → to.] |

- **Regulatory role:** [NEEDS CLARIFICATION: covered entity, business associate, or neither]
- **Third parties that receive PHI:** [Name each, and whether an agreement is in place] (HIPAA §164.502(e))

## Interoperability

Name the information, not the mechanism.

| Exchange | Partner system | Direction | Information exchanged | Purpose | Trigger and timeliness |
|---|---|---|---|---|---|
| [Name] | [Who.] | [In / out / both] | [e.g. patient demographics, laboratory results] | [Treatment / payment / operations / patient request] | [Event, and how soon.] |

## Software safety classification

| Question | Answer |
|---|---|
| Is this medical device software, or part of one? | [Yes / No — NEEDS CLARIFICATION: who decided, and where it is recorded] |
| Worst credible harm if the feature fails or is wrong | [None / non-serious injury / serious injury or death] |
| Proposed safety class | [A / B / C] (IEC 62304 §4.3) |
| Risk controls outside the software | [None, or what they are.] |
| Safety-related requirements | [FR and NFR ids.] |

<!-- @slot review-checklist-items -->
- [ ] The PHI inventory lists every element, each with a purpose and a minimum-necessary justification (HIPAA §164.502(b))
- [ ] Each exchange names the information and the purpose, and no protocol detail
- [ ] The software safety class is proposed with its rationale, or "not medical device software" is recorded with who decided (IEC 62304 §4.3)
- [ ] Each third party that receives PHI is named (HIPAA §164.502(e))
- [ ] No example contains real patient data
