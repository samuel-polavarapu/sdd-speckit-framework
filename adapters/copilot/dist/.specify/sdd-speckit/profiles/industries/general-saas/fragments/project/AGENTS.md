<!-- @slot rules-items -->
- Scope every query, cache key, job and event to the tenant taken from the authenticated session. Never accept a tenant identifier from caller input as the scope (SOC 2 CC6.1).
- When you add a data access path, add its negative cross-tenant test first. Do not report the task done without it.
- Do not add, rename or repurpose a personal data field unless the spec's personal-data inventory has a row for it. If it has none, stop and ask (GDPR Art. 5, Art. 6).
- Do not log, trace or put in an error message any personal data, token or customer content. Log identifiers only (GDPR Art. 5(1)(c)).
- Do not add a third-party service, SDK or outbound call that receives customer or personal data unless the spec lists it as a sub-processor (GDPR Art. 28(2)).
- Use synthetic data in tests, fixtures and examples. Never copy production or customer data into the repository or a prompt.
- Do not weaken or bypass an authentication, authorization or audit-logging check to make a test pass. Report the failing test.
- Do not deploy, merge or change production configuration yourself. A human other than the author approves every change (SOC 2 CC8.1).

<!-- @slot sections-end -->
### Regulated context — General SaaS / B2B software

This is multi-tenant software in scope for SOC 2, GDPR and CCPA/CPRA. OWASP ASVS 5.0 is the
security baseline and WCAG 2.2 level AA is the accessibility baseline. Annex R of the constitution
maps each control to its evidence.

| When you | Also do |
|---|---|
| Add an entity, endpoint, job or export | Enforce the tenant scope, add the negative cross-tenant test, update the plan's tenant isolation table. |
| Add or change a personal data field | Check the spec's inventory row, then update classification, retention, deletion and export. |
| Add a privileged or security-relevant action | Write the audit record: actor, tenant, action, target, time, outcome. |
| Change a user-facing view | Run the accessibility check; keep keyboard, focus and labels working. |
| Prepare a change for release | Leave the evidence the `soc2-change` checklist asks for: linked request, test results, rollback path. |

This is engineering guidance, not legal or compliance advice. When a rule here and a requirement
seem to conflict, stop and ask; do not choose for the compliance owner.
