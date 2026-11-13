<!-- @slot checklist-items -->
- [ ] The change stays within the FIPS 199 categorisation and the authorisation boundary in the spec and plan, or the ISSO has reviewed the difference
- [ ] The control implementation summary in `plan.md` matches this change, and each control touched has a test or other evidence (control ids: <!-- e.g. AC-3, AU-12 -->)
- [ ] No new cryptographic module, algorithm, external service or hosting region is introduced outside the plan (FIPS 140-3, NIST SA-9)
- [ ] New dependencies are supported and appear in the software bill of materials (NIST CM-8, SA-22)
- [ ] Security-relevant actions write an audit record, and no log line holds PII or CUI (NIST AU-3)
- [ ] User-facing changes pass the automated accessibility check and a keyboard and screen reader pass (Section 508, WCAG 2.0 AA)
