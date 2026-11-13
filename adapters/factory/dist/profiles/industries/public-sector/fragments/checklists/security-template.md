<!-- @slot identity-rows -->
| C-PS-01 | Organisational users authenticate with multi-factor authentication, and the plan names the factor and the identity source (NIST IA-2). | [ ] | |
| C-PS-02 | Each role and service identity has only the privileges its function needs, and the plan holds the role matrix (NIST AC-6). | [ ] | |
| C-PS-03 | Idle sessions lock or end after the period the baseline sets, and accounts are disabled when access is revoked (NIST AC-2, AC-11, AC-12). | [ ] | |
| C-PS-04 | A system use notification is shown before access where the agency requires one (NIST AC-8). | [ ] | |

<!-- @slot input-rows -->
| C-PS-05 | Input is validated at every point where data enters the authorisation boundary (NIST SI-10). | [ ] | |
| C-PS-06 | Error messages give the user what is needed to correct the input and reveal nothing an attacker can use (NIST SI-11). | [ ] | |

<!-- @slot data-rows -->
| C-PS-07 | Every cryptographic use is in the plan's cryptography inventory with an active FIPS 140-3 certificate number (NIST SC-13). | [ ] | |
| C-PS-08 | Data in transit and at rest is protected by those validated modules, running in approved mode (NIST SC-8, SC-28). | [ ] | |
| C-PS-09 | Keys are generated, stored, rotated and destroyed as the plan states, and no key is in code or configuration (NIST SC-12). | [ ] | |
| C-PS-10 | Audit records carry actor, action, target, time, source and outcome, and the actor cannot change them (NIST AU-3, AU-9). | [ ] | |

<!-- @slot supply-chain-rows -->
| C-PS-11 | The pipeline produces a software bill of materials for every release build, and it is stored with the build (NIST CM-8). | [ ] | |
| C-PS-12 | No component is past its end of support, or each one has a replacement plan and a recorded risk decision (NIST SA-22). | [ ] | |
| C-PS-13 | Vulnerability scans cover code, dependencies and images, and each open finding has a plan-of-action entry inside the remediation window (NIST RA-5, SI-2). | [ ] | |
| C-PS-14 | Every external service the feature calls is inside the authorisation boundary, or is itself authorised at the required impact level (NIST SA-9). | [ ] | |
