<!-- @slot technical-context-extra-rows -->
| PHI in scope | [Yes / No — see the PHI inventory in `spec.md`] |
| Regulatory role | [Covered entity / business associate / neither] |
| Software safety class | [A / B / C per IEC 62304 §4.3, or "not medical device software" and where that is recorded] |
| Interoperability standard | HL7 FHIR R4 (4.0.1) [and the implementation guide and version, or "none"] |
| Encryption | [At rest: algorithm and key custody · In transit: protocol and minimum version] (HIPAA §164.312(a)(2)(iv), §164.312(e)(2)(ii)) |

<!-- @slot constitution-check-rows -->
| G-HC-1 PHI inventory and minimum necessary | [PASS / FAIL] | [Link to the PHI inventory; elements dropped as unnecessary.] |
| G-HC-2 Audited PHI access | [PASS / FAIL] | [Audit events designed for every PHI operation; test ids.] |
| G-HC-3 Safety class and traceability | [PASS / FAIL] | [Class and rationale; where the traceability matrix lives.] |
| G-HC-4 No real PHI outside production | [PASS / FAIL] | [Source of test data; de-identification method.] |

<!-- @slot test-strategy-extra-rows -->
| Access control | Each role against each PHI operation, including emergency access and another patient's record | [Tool.] | Every cell of the access matrix |
| Audit trail | Each PHI create, read, update, delete and disclosure emits one complete event | [Tool.] | 100 % of PHI operations |
| Interoperability conformance | Exchanged resources against FHIR R4 and the declared profiles | [Validator.] | Zero error |
| De-identification | Non-production data set against the 18 identifier types | [Tool.] | Zero identifier found |
| Traceability | Every requirement and risk control maps to a passing test | [Script.] | No unmapped id |

<!-- @slot risks-rows -->
| R-HC-1 | PHI appears in a log, an error message, a trace or an analytics event. | [L/M/H] | H | [Structured logging with an allow-list of fields; a test that scans output.] |
| R-HC-2 | A PHI operation is added without an audit event. | [L/M/H] | H | [Audit at one choke point; coverage test per operation (HIPAA §164.312(b)).] |
| R-HC-3 | Real PHI is copied to a non-production environment or into an AI-assistant prompt. | [L/M/H] | H | [Synthetic data only; write-time gate; de-identification pipeline (HIPAA §164.514(b)).] |
| R-HC-4 | A third party receives PHI with no business associate agreement. | [L/M/H] | H | [Agreement register checked before integration (HIPAA §164.502(e)).] |
| R-HC-5 | A wrong or stale clinical value is shown or exchanged (unit, code, patient match). | [L/M/H] | [By safety class] | [Risk control, and the test that verifies it (IEC 62304 §7).] |

<!-- @slot rollout-items -->
- **Breach readiness:** [Who is told if PHI is exposed during rollout, and how the exposure is scoped from the audit trail] (HIPAA §164.308(a)(6), §164.404).
- **Downtime procedure:** [How care continues, and how data is reconciled afterwards] (HIPAA §164.308(a)(7)).

<!-- @slot sections-before-open-questions -->
## PHI safeguards

| PHI store or flow | Encryption at rest | Encryption in transit | Who has access | Key custody |
|---|---|---|---|---|
| [Store or flow from the PHI inventory] | [Mechanism] | [Protocol and version] | [Roles, service identities] | [Who holds and rotates keys] |

- **Access model:** [Roles, and the rule that limits a user to their patients.] Unique identity per person and per service (HIPAA §164.312(a)(2)(i), §164.312(d)).
- **Emergency access:** [How break-glass is requested, time-limited, audited and reviewed] (HIPAA §164.312(a)(2)(ii)).
- **Automatic logoff:** [Idle limit per client type] (HIPAA §164.312(a)(2)(iii)).
- **Integrity:** [How improper alteration or deletion of PHI is detected] (HIPAA §164.312(c)(1)).
- **Third parties:** [Each service that handles PHI, and its agreement reference] (HIPAA §164.308(b)(1)).

## Audit trail design

Implements HIPAA §164.312(b). One event per PHI operation, written at [the single component that
all PHI access passes through].

| Field | Content | Note |
|---|---|---|
| Actor | [Unique user or service id, and role] | Never a shared account. |
| Action | [Create / read / update / delete / export / disclose / emergency access] | |
| Subject | [Patient id and record id] | Identifiers only. No clinical content in the event. |
| Time | [UTC, from a synchronised clock] | |
| Origin | [Client, network location, request id] | |
| Outcome | [Success / denied / error] | Denied attempts are recorded. |
| Reason | [Purpose of use; required for emergency access] | |

- **Store:** [Append-only, separate from application data; who can read it; nobody can edit it] (HIPAA §164.312(c)(1)).
- **Retention:** [NEEDS CLARIFICATION: period; six years is the documentation rule in §164.316(b)(2)(i)]
- **Review:** [Who examines the trail, how often, and which patterns alert] (HIPAA §164.308(a)(1)(ii)(D)).
- **Exchange format:** [FHIR R4 `AuditEvent`, or "internal only"].

## Interoperability design

Maps each exchange in `spec.md` to HL7 FHIR R4 (4.0.1). Full detail in `./contracts/`.

| Exchange (from spec) | FHIR resources | Profile | Interaction | Authorisation | PHI elements |
|---|---|---|---|---|---|
| [Name] | [e.g. `Patient`, `Observation`] | [Implementation guide profile, or base] | [read / search / create / operation / messaging] | [Scheme and scopes] | [From the PHI inventory] |

- **Capability statement:** [Where the supported resources and interactions are published.]
- **Terminology:** [Code systems and value sets used, and their versions.]
- **Patient matching:** [How a record is tied to the right patient, and what happens on doubt.]

## Software safety and traceability

- **Safety class:** [A / B / C], because [worst credible harm, and external risk controls] (IEC 62304 §4.3).
- **Software items and their class:** [Item → class. An item inherits the system class unless segregation is justified.]
- **Third-party software (SOUP):** [Each item, version, and the function relied on] (IEC 62304 §5.3, §8.1.2).

| Requirement | Hazard or risk control | Design element | Test | Status |
|---|---|---|---|---|
| [FR-001] | [Hazard id, or "none"] | [Component] | [Test id] | [Planned / passing] |

The full matrix lives in [path]. The traceability gate fails the build on an unmapped requirement
or risk control (IEC 62304 §5.1.1, §7.3).

## De-identification and non-production data

- **Test data source:** [Synthetic generator, or de-identified extract.] Real PHI never leaves production.
- **Method, if an extract is used:** [Safe Harbor: all 18 identifier types removed · or Expert Determination, with the record of it] (HIPAA §164.514(b)).
- **Re-identification:** [No key outside production, or how the key is protected] (HIPAA §164.514(c)).
- **Verification:** [The automated check that runs before data is loaded, and who signs it off.]

<!-- @slot artifacts-items -->
- [ ] Traceability matrix (requirement → risk control → design → test)
- [ ] `checklists/hipaa-safeguards.md` and `checklists/phi-handling.md`
