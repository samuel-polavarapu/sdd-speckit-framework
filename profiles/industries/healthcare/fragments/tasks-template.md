<!-- @slot conventions-items -->
- A task that touches PHI names its audit-event test in the same row or the row before it. This is constitution gate G-HC-2.
- Fixtures and seed data are synthetic. A task never copies production data. This is constitution gate G-HC-4.

<!-- @slot sections-after-phases -->
## Regulatory tasks — Healthcare and life sciences

| ID | Task | File | When needed |
|---|---|---|---|
| R001 | Write the failing audit-trail test: one complete event per PHI operation, including denied attempts (HIPAA §164.312(b)). | `[path]` | Any PHI operation |
| R002 | Write the access-matrix test: each role against each PHI operation, another patient's record, and emergency access (HIPAA §164.312(a)(1)). | `[path]` | Any PHI operation or role change |
| R003 | Implement audit-event emission at the PHI access choke point. | `[path]` | After R001 |
| R004 | Configure encryption at rest and in transit for each new PHI store and flow (HIPAA §164.312(a)(2)(iv), §164.312(e)(2)(ii)). | `[path]` | Any new store or flow |
| R005 | Add the log-scrubbing test: no PHI element in logs, errors, traces or analytics. | `[path]` | Any PHI operation |
| R006 | Add FHIR R4 conformance tests for each exchanged resource and profile. | `[path]` | Any exchange |
| R007 | Build or extend the synthetic data set; add the de-identification check for any extract (HIPAA §164.514(b)). | `[path]` | Any new PHI element |
| R008 | Update the traceability matrix: requirement → risk control → design → test (IEC 62304 §5.1.1, §7.3). | `[path]` | Every feature in class B or C; class A when required by the plan |
| R009 | Record each new third-party component as SOUP with version and known anomalies reviewed (IEC 62304 §8.1.2, §7.1.3). | `[path]` | Any new dependency in class B or C |
| R010 | Confirm a business associate agreement covers each new third party that handles PHI, and add it to the register (HIPAA §164.308(b)(1)). | `[path]` | Any new third party |
| R011 | Update the security risk analysis and the breach runbook for the new PHI store, flow or party (HIPAA §164.308(a)(1)(ii)(A), §164.308(a)(6)). | `[path]` | Any new store, flow or party |

<!-- @slot coverage-rows -->
| NFR-HC-01 | R002 |
| NFR-HC-02 | R001, R003 |
| NFR-HC-03 | R004 |
| NFR-HC-04 | R005, R007 |
| NFR-HC-05 | R006 |
| NFR-HC-06 | R008 |

<!-- @slot definition-of-done-items -->
- [ ] Every PHI operation has a passing audit-trail test and a passing access-control test (HIPAA §164.312(a)–(b))
- [ ] No PHI element appears in a log, a fixture or a commit
- [ ] The traceability matrix has no requirement or risk control without a passing test (IEC 62304 §5.7)
- [ ] The `hipaa-safeguards` and `phi-handling` checklists show no open **no**
- [ ] Each third party that handles PHI has an agreement on record (HIPAA §164.308(b)(1))
