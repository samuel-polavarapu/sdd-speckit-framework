<!-- @slot rules-items -->
- Read the security categorisation in `spec.md` and the control implementation summary in `plan.md` before you change code. They decide what the code must do.
- Use only the cryptographic modules listed in the plan's cryptography inventory. Do not write a cryptographic routine, add a cryptographic library or change a cipher or protocol setting on your own (FIPS 140-3, NIST SC-13).
- Do not add a dependency, an external service call, a telemetry endpoint or a hosting region that the plan does not list. Each one can change the authorisation boundary. Stop and ask (NIST SA-9, CM-3).
- Do not remove, weaken or bypass an audit record, an authorisation check or a session control, even to make a test pass (NIST AU-12, AC-3).
- Never write personal data or controlled unclassified information to a log, an error message, a test fixture or a prompt. Use synthetic data.
- Every user-facing change meets WCAG 2.0 Level AA: text alternatives, labels, keyboard operation, visible focus and contrast. This includes generated documents and emails (Section 508).
- Name the control id in the task and the commit when a change implements a control, for example "(AC-3)".
- Do not mark a control as implemented, accept a risk or grant a waiver. Those decisions belong to a named human.

<!-- @slot sections-end -->
### Public sector and government rules

This project builds a government system that needs an authorisation to operate. Changes are
assessed against NIST SP 800-53 Rev. 5 at the baseline the constitution names.

| Before you | Check |
|---|---|
| Add or upgrade a dependency | It is supported, it appears in the software bill of materials and the plan lists it (NIST CM-8, SA-22). |
| Touch authentication, sessions or roles | The plan's rows for AC-2, AC-3, AC-6 and IA-2 still describe the code. |
| Add an action that creates, changes, deletes or exports data | An audit record is written, and a test asserts its content (NIST AU-3). |
| Store a new field | It has a row in the data model's classification and records tables. |
| Change infrastructure or configuration | The setting is in version control and matches the approved baseline (NIST CM-2, CM-6). |
| Build or change a view, a document or a message | It passes the automated accessibility check, and the `section-508` checklist is updated. |

When a request conflicts with a control, stop and report the conflict with the control id. Do not
choose between them.
