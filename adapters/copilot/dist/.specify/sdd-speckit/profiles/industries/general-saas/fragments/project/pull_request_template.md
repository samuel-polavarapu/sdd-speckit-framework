<!-- @slot checklist-items -->
- [ ] Every new or changed data access path is tenant-scoped, with a negative cross-tenant test in this change (SOC 2 CC6.1)
- [ ] No personal data field is added or repurposed outside the spec's personal-data inventory (GDPR Art. 5, Art. 6)
- [ ] Deletion, export and retention cover every new personal data field (GDPR Art. 17, Art. 20; CCPA §1798.105)
- [ ] No personal data, token or customer content is written to logs or error messages (GDPR Art. 5(1)(c))
- [ ] No new sub-processor or outbound data flow, or it is listed in the spec and approved (GDPR Art. 28(2); SOC 2 CC9.2)
- [ ] This change links its change request, and its approver is not its author (SOC 2 CC8.1)
- [ ] User-facing changes pass the accessibility check (WCAG 2.2 level AA)
