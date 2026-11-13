<!-- @slot identity-rows -->
| C-HC-01 | Each person and each service that reaches PHI has its own identity. No shared account exists (HIPAA §164.312(a)(2)(i)). | [ ] | |
| C-HC-02 | Emergency access is time-limited, needs a stated reason, and raises a review item (HIPAA §164.312(a)(2)(ii)). | [ ] | |
| C-HC-03 | A session that shows PHI ends after the idle limit the plan states (HIPAA §164.312(a)(2)(iii)). | [ ] | |
| C-HC-04 | Every PHI create, read, update, delete and disclosure writes an audit event, and so does every denied attempt (HIPAA §164.312(b)). | [ ] | |

<!-- @slot input-rows -->
| C-HC-05 | Inbound FHIR resources are validated against R4 and the declared profiles before they are stored or acted on (HL7 FHIR R4). | [ ] | |
| C-HC-06 | Error responses and operation outcomes sent to another system contain no PHI beyond what the request already held (HIPAA §164.502(b)). | [ ] | |

<!-- @slot data-rows -->
| C-HC-07 | Every PHI store, backup, cache and export is encrypted at rest, and the plan names key custody (HIPAA §164.312(a)(2)(iv)). | [ ] | |
| C-HC-08 | Every PHI flow is encrypted in transit, inside the network as well as at its edge (HIPAA §164.312(e)(1), §164.312(e)(2)(ii)). | [ ] | |
| C-HC-09 | Improper alteration or deletion of PHI and of audit records is detectable (HIPAA §164.312(c)(1)). | [ ] | |
| C-HC-10 | A test proves that no PHI element reaches logs, traces, error reports or analytics (HIPAA §164.502(b)). | [ ] | |

<!-- @slot supply-chain-rows -->
| C-HC-11 | Each third-party service that handles PHI has a signed business associate agreement on record (HIPAA §164.308(b)(1), §164.314(a)). | [ ] | |
| C-HC-12 | Each third-party component in class B or C software is recorded as SOUP with its version, and its known anomalies are reviewed (IEC 62304 §8.1.2, §7.1.3). | [ ] | |
| C-HC-13 | The security risk analysis is updated for each new PHI store, flow and third party (HIPAA §164.308(a)(1)(ii)(A)). | [ ] | |
