<!-- @slot conventions-items -->
- A task that implements a control names the control id in its text, for example "(AC-3)". The id
  is the link an assessor follows from the plan to the code.
- A task that produces evidence states where the evidence is written.

<!-- @slot sections-after-phases -->
## Regulatory tasks — Public sector and government

| ID | Task | File | When needed |
|---|---|---|---|
| R001 | Write a test for each control marked "implemented" in the plan's control implementation summary, before the code that satisfies it. | `[test path]` | Every feature |
| R002 | Emit an audit record for each event in the audit design, and assert its content in a test (AU-3, AU-12). | `[path]` | Any security-relevant action |
| R003 | Enforce authorisation per operation and per record, and test the denial paths (AC-3, AC-6). | `[path]` | Any new operation or data access |
| R004 | Confirm each cryptographic use resolves to the validated module in approved mode, and fail the build otherwise (SC-13, FIPS 140-3). | `[pipeline path]` | Any new or changed cryptographic use |
| R005 | Generate the software bill of materials in the pipeline and store it with the build (CM-8, SA-10). | `[pipeline path]` | Any dependency or build change |
| R006 | Run the vulnerability and configuration scans, and record each open finding in the plan of action (RA-5, SI-2, CM-6). | `[report path]` | Every feature |
| R007 | Run the automated accessibility check and the manual assistive-technology pass on changed views and documents (Section 508). | `checklists/section-508.md` | Any user-facing change |
| R008 | Update the accessibility conformance report for the changed product areas. | `[report path]` | Any user-facing change |
| R009 | Implement the retention and disposition step for each record type (SI-12, AU-11). | `[path]` | Any new or changed record type |
| R010 | Update the system security plan text, the boundary diagram and the inventory, and send them to the ISSO (CM-3, CM-4). | `[document path]` | Any boundary, control or component change |

<!-- @slot coverage-rows -->
| NFR-PS-01 | R001, R003, R006 |
| NFR-PS-02 | R002 |
| NFR-PS-03 | R010 |
| NFR-PS-04 | R004 |
| NFR-PS-05 | R007, R008 |
| NFR-PS-06 | R009 |

<!-- @slot definition-of-done-items -->
- [ ] Every row of the control implementation summary has evidence that exists, at the path it names
- [ ] No cryptographic use is outside a FIPS 140-3 validated module in approved mode
- [ ] The software bill of materials for the release build is stored, and no component is unsupported
- [ ] The `section-508` checklist has no standing **no**, and the conformance report is updated
- [ ] The `ato-readiness` checklist has no standing **no**
- [ ] Every open finding or unmet control has a plan-of-action entry with an owner and a date
