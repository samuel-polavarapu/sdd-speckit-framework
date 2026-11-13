<!-- @slot rules-items -->
- Treat any data tied to a patient as protected health information (PHI). Never put real PHI in code, a fixture, a test, a log line, a commit message, an issue or a prompt. Use synthetic data only (HIPAA §164.502(b), §164.514).
- Do not send PHI to a tool, a model or a service that the business associate agreement register does not list. If you are unsure, stop and ask (HIPAA §164.502(e)).
- Every code path that creates, reads, changes, deletes or discloses PHI emits an audit event. Write the audit test first. Do not add a path that bypasses the audit point (HIPAA §164.312(b)).
- Log record identifiers, never PHI content. Do not print a request or response body that may hold PHI.
- Never weaken an access check, encryption, automatic logoff or an audit event to make a test pass (HIPAA §164.312).
- Never invent clinical logic: a dose, a unit, a threshold, a code or a patient-matching rule. Take it from the spec, or mark it `[NEEDS CLARIFICATION: question]`.
- In class B or C software, change code only against a requirement that has a risk-control link and a test, and update the traceability matrix in the same change (IEC 62304 §5.1.1, §7.3).
- Do not add a dependency to class B or C software without recording it as SOUP with its version (IEC 62304 §8.1.2).

<!-- @slot sections-end -->
### Healthcare and life sciences

| Topic | Where it is defined | Rule |
|---|---|---|
| PHI inventory | `spec.md` → PHI inventory | A field not listed there is not collected, stored or shown. |
| PHI classification | `data-model.md` → PHI classification | Matches the inventory field for field. |
| Audit trail | `plan.md` → Audit trail design | One event per PHI operation, at the single audit point. |
| Interoperability | `plan.md` → Interoperability design, `contracts/` | HL7 FHIR R4 (4.0.1). Validate every resource in and out. |
| Safety class | `plan.md` → Software safety and traceability | The class sets how much design, review and test a change needs. |
| Test data | `plan.md` → De-identification and non-production data | Synthetic by default. Never copy production data. |

If you find what looks like real PHI in the repository, a log or a prompt: stop, do not copy or
quote it, and tell the human reviewer. It may be a reportable incident (HIPAA §164.308(a)(6)).

Feature checklists for this domain: `hipaa-safeguards` and `phi-handling`, beside `security`,
`privacy`, `accessibility` and `release`.
