<!-- @slot conventions-items -->
- A task that adds a data access path names its negative cross-tenant test task. This is constitution gate G-GS-1.
- A task that adds or changes a personal data field names the PD id from the spec's inventory. This is constitution gate G-GS-2.

<!-- @slot sections-after-phases -->
## Regulatory tasks — General SaaS / B2B software

| ID | Task | File | When needed |
|---|---|---|---|
| R001 | Write the negative cross-tenant tests: read, write, list, search and export as tenant A against tenant B's data (SOC 2 CC6.1). They must fail before the implementation exists. | `[path]` | Any new or changed data access path |
| R002 | Enforce the tenant scope in the shared data-access layer for each new entity, and carry the tenant context into each new job and event (SOC 2 CC6.1). | `[path]` | Any new tenant-owned entity, job or event |
| R003 | Add the audit record for each privileged or security-relevant action, with a test that it is written (SOC 2 CC7.2; ASVS 5.0 V16). | `[path]` | Any privileged action, export or permission change |
| R004 | Extend the access, export and deletion paths to cover each new personal data field, including caches, backups and sub-processors, with a test (GDPR Art. 15, Art. 17, Art. 20; CCPA §1798.105, §1798.110). | `[path]` | Any new personal data element |
| R005 | Add the retention rule or job for each new personal data entity, with a test (GDPR Art. 5(1)(e); SOC 2 C1.2). | `[path]` | Any new entity with a retention period |
| R006 | Update the record of processing, the privacy notice and the sub-processor register (GDPR Art. 13, Art. 28(2), Art. 30). | `[path]` | New data element, purpose or sub-processor |
| R007 | Add redaction so that no personal data or secret reaches logs, traces or error reports, with a test (GDPR Art. 5(1)(c); ASVS 5.0 V16). | `[path]` | Any new log line or outbound payload near personal data |
| R008 | Run the automated accessibility check and the manual assistive-technology pass on each new or changed view (WCAG 2.2 level AA). | `[path]` | Any user-facing change |
| R009 | Complete `checklists/soc2-change.md` and attach the test and approval evidence to the change record (SOC 2 CC8.1). | `checklists/soc2-change.md` | Every production change |

<!-- @slot coverage-rows -->
| NFR-GS-01 | R001, R002 |
| NFR-GS-02 | R006, R007 |
| NFR-GS-03 | R004, R005 |
| NFR-GS-04 | R003 |
| NFR-GS-05 | R008 |
| NFR-GS-06 | [tasks] |

<!-- @slot definition-of-done-items -->
- [ ] Negative cross-tenant tests pass for every new or changed access path (G-GS-1; SOC 2 CC6.1)
- [ ] Every personal data field maps to a row of the spec's inventory, with retention and deletion implemented (G-GS-2; GDPR Art. 5, Art. 17)
- [ ] The `soc2-change` checklist is complete, with evidence linked (G-GS-3; SOC 2 CC8.1)
- [ ] The accessibility checklist has no open **no** for a user-facing change (WCAG 2.2 level AA)
