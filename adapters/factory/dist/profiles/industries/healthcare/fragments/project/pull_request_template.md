<!-- @slot checklist-items -->
- [ ] No real PHI is in the diff, the fixtures, the logs, the screenshots or this description (HIPAA §164.502(b))
- [ ] Every new or changed PHI operation has an audit event and a test for it (HIPAA §164.312(b))
- [ ] Access to new PHI is checked per role and per patient, and a test covers the denied case (HIPAA §164.312(a)(1))
- [ ] New PHI fields are in the spec's PHI inventory and the data model's PHI classification
- [ ] Exchanged resources pass FHIR R4 conformance tests, or this change exchanges none
- [ ] The traceability matrix is updated for each requirement and risk control this change touches (IEC 62304 §5.1.1)
- [ ] Any new third party that handles PHI has a business associate agreement on record (HIPAA §164.308(b)(1))
