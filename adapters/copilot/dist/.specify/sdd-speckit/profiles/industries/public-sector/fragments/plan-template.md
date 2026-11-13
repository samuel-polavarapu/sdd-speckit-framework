<!-- @slot technical-context-extra-rows -->
| Security categorisation | [C / I / A impact from `spec.md`, and the resulting level] (FIPS 199) |
| Control baseline | [FedRAMP Rev. 5 Low / Moderate / High, or agency baseline] |
| Authorisation boundary | [Inside the existing boundary / significant change — see the boundary section] |
| Hosting and residency | [Authorised environment and region. NEEDS CLARIFICATION if not decided] |
| Cryptographic modules | [Module name and FIPS 140-3 certificate number, per use] |
| Identity source | [Organisational users: provider and factor. Public users: provider and assurance level] |

<!-- @slot constitution-check-rows -->
| G-PS-1 Categorise before design | [PASS / FAIL] | [Categorisation in `spec.md`, approver and date.] |
| G-PS-2 Controls are traced | [PASS / FAIL] | [Count of rows in the control implementation summary; count still blank.] |
| G-PS-3 Validated cryptography only | [PASS / FAIL] | [Every row of the cryptography inventory has a certificate number.] |
| G-PS-4 Section 508 conformance | [PASS / FAIL / N/A] | [Checklist path, or the reason no user-facing surface changes.] |

<!-- @slot test-strategy-extra-rows -->
| Control verification | Access denial, account lifecycle, session termination, audit record content (NIST AC-3, AC-12, AU-3) | [Tool.] | One test per control marked "implemented" |
| Accessibility | New or changed views, documents and messages (Section 508, WCAG 2.0 AA) | [Automated checker, and a manual pass with assistive technology] | Zero open Level A or AA failure |
| Vulnerability and configuration scan | Code, dependencies, images and configuration settings (NIST RA-5, CM-6, SA-11) | [Tool.] | No finding above [severity] without a plan-of-action entry |
| Cryptographic configuration | Every protected channel and store uses the approved mode (NIST SC-8, SC-13, SC-28) | [Tool.] | Zero non-approved algorithm or module |

<!-- @slot risks-rows -->
| R-PS-1 | The feature raises the system impact level or extends the authorisation boundary, which triggers a significant-change review. | [L/M/H] | H | [Confirm with the ISSO before design is final. Owner.] |
| R-PS-2 | A dependency or managed service is outside the authorised boundary, or is not itself authorised at the required level (NIST SA-9). | [L/M/H] | H | [Check each one against the boundary inventory. Owner.] |
| R-PS-3 | A cryptographic library is not a validated module, or runs outside its approved mode (FIPS 140-3). | [L/M/H] | H | [Verify the certificate and the mode in CI. Owner.] |
| R-PS-4 | An accessibility failure is found after build, in a component that is hard to change (Section 508). | [L/M/H] | M | [Test with assistive technology in the first slice. Owner.] |
| R-PS-5 | Audit records are incomplete, so an assessor cannot reconstruct an event (NIST AU-3, AU-12). | [L/M/H] | M | [Assert record content in tests. Owner.] |

<!-- @slot rollout-items -->
- **Change approval:** [Change request id, security impact analysis and approver] (NIST CM-3, CM-4).
- **Authorisation impact:** [None / update to the system security plan / significant-change
  notification to the authorising official].

<!-- @slot sections-before-open-questions -->
## Control implementation summary

One row per NIST SP 800-53 Rev. 5 control this feature implements, changes or relies on. Start
from the baseline; delete the example rows that do not apply and add the ones that do.
**Origin:** implemented here / inherited from [provider] / shared / planned (needs a
plan-of-action entry).

| Control | Requirement in this feature | Origin | How it is implemented or inherited | Evidence |
|---|---|---|---|---|
| AC-2 | [Account types, approval, removal.] | [Origin.] | [Component and mechanism.] | [Test or document.] |
| AC-3 | [Authorisation rule per operation and per record.] | [Origin.] | [Mechanism.] | [Test.] |
| AC-6 | [Least privilege for users and service identities.] | [Origin.] | [Mechanism.] | [Role matrix.] |
| IA-2 | [Authentication and multi-factor for organisational users.] | [Origin.] | [Mechanism.] | [Test.] |
| AU-2 | [Events this feature must log.] | [Origin.] | [Mechanism.] | [Log sample.] |
| SC-8 | [Protection of data in transit.] | [Origin.] | [Mechanism.] | [Configuration.] |
| SC-28 | [Protection of data at rest.] | [Origin.] | [Mechanism.] | [Configuration.] |
| SI-10 | [Input validation at each trust boundary.] | [Origin.] | [Mechanism.] | [Test.] |
| CM-3 | [How this change is approved and tracked.] | [Origin.] | [Mechanism.] | [Change record.] |
| [ID] | [Requirement.] | [Origin.] | [Mechanism.] | [Evidence.] |

## Authorisation boundary and data residency

- **Boundary impact:** [No change / new component inside the boundary / new external connection /
  boundary extended]. A change other than "no change" needs a security impact analysis (NIST CM-4).
- **Boundary diagram:** [Updated diagram path, or "unchanged".]

| Data flow | From | To | Crosses the boundary | Protection | Agreement or authorisation |
|---|---|---|---|---|---|
| [Flow.] | [Component.] | [Component or external system.] | [yes / no] | [Mechanism.] (NIST SC-7, SC-8) | [Interconnection agreement, or the provider's authorisation and level.] (NIST SA-9) |

- **Residency:** Data, backups, logs and support access stay in [jurisdiction]. Locations:
  [regions]. Exceptions: [none].
- **External services:** [Each service, what data it sees, and its authorisation level — or "none".]

## Cryptography inventory

Every use of cryptography that protects government data. A blank certificate cell fails gate
G-PS-3 (FIPS 140-3; NIST SC-12, SC-13).

| Use | Data protected | Module | Certificate | Approved mode confirmed | Key management |
|---|---|---|---|---|---|
| [Transit / at rest / signing / authentication] | [What.] | [Module and version.] | [Number, status "active".] | [How it is checked.] | [Where keys live, rotation, who may use them.] |

## Audit and records design

| Event | Trigger | Record content | Store | Retention | Reviewed by |
|---|---|---|---|---|---|
| [Event from the spec.] | [Action.] | [Actor, action, target, time, source, outcome.] (NIST AU-3) | [Store.] | [Period.] (NIST AU-11) | [Role, frequency.] (NIST AU-6) |

- **Protection:** [How records are protected from change and from the actors they describe.] (NIST AU-9)
- **On logging failure:** [Behaviour and alert.] (NIST AU-5)
- **Records disposition:** [Schedule item, and the job or step that disposes of records when due.] (NIST SI-12)

## Supply chain and configuration evidence

- **Bill of materials:** [Format, where the pipeline writes it, and where it is kept.] (NIST CM-8)
- **Provenance:** [How the build is tied to a reviewed commit and how the artifact is signed.] (NIST SA-10)
- **Configuration baseline:** [Hardening benchmark and where the settings are in version control.] (NIST CM-2, CM-6)
- **Unsupported components:** [None, or: component, end-of-support date, replacement plan.] (NIST SA-22)

<!-- @slot artifacts-items -->
- [ ] `checklists/ato-readiness.md`
- [ ] `checklists/section-508.md`
- [ ] Updated boundary diagram, or a note that it is unchanged
- [ ] Software bill of materials for the release build
