# Industry profiles

An industry profile adds a domain's standards to the templates. With a profile chosen, the
constitution gets that domain's gates, every spec gets its requirements and data sections, every
plan gets its design sections, every task list gets its regulatory tasks, and the checklists get
its control rows.

Related: [TEMPLATES.md](TEMPLATES.md) · [HARNESS.md](HARNESS.md) ·
[ONBOARDING-GREENFIELD-BROWNFIELD.md](ONBOARDING-GREENFIELD-BROWNFIELD.md)

Command names below are the Claude Code form, `/sdd-speckit:speckit.<phase>`. In GitHub Copilot
the same phase is `/sdd-speckit-<phase>`.

## Read this first

> **A profile is engineering guidance. It is not legal or compliance advice.**
>
> - The control citations in the four shipped profiles were written from general knowledge of
>   the standards. **They were not verified against the text of each standard.** A clause number
>   can be wrong or out of date.
> - A profile does not make a system compliant. It makes the controls visible in every artifact,
>   so that people can check them.
> - Your organisation's compliance owner must confirm which standards apply, which controls
>   apply, and each interpretation, before the project relies on a profile.
> - Each standard in `profile.json` has a `reviewedOn` date. All four profiles carry
>   `2026-11-13`, the date they were written. Review a profile again when a standard changes.

Every profile repeats this in the `Annex R` it adds to the constitution.

## Choose a profile

| Way | Command |
|---|---|
| Node installer | `npx create-sdd-speckit-app . --industry=healthcare` |
| Bash installer | `./installer/install.sh . --industry=healthcare` |
| In a session | `/sdd-speckit:speckit.setup industry` or `/sdd-speckit:speckit.onboard` |
| Script | `python3 .specify/sdd-speckit/scripts/onboard-project.py --project . --industry healthcare` |

The default is `none`. The framework never detects an industry and never chooses one for you.
One project has one industry profile. List the profiles with
`python3 scripts/compose-templates.py --list`.

## The four profiles

| Id | Code | Label | Constitution gates | Own checklists | Sensitive patterns |
|---|---|---|---|---|---|
| `general-saas` | GS | General SaaS / B2B software | `G-GS-1` Tenant isolation · `G-GS-2` Personal data declared · `G-GS-3` Change evidence | `soc2-change` | none |
| `healthcare` | HC | Healthcare and life sciences | `G-HC-1` PHI inventory and minimum necessary · `G-HC-2` Audited PHI access · `G-HC-3` Safety class and traceability · `G-HC-4` No real PHI outside production | `hipaa-safeguards`, `phi-handling` | `us-ssn` |
| `financial-services` | FS | Financial services and payments | `G-FS-1` Cardholder data scope declared · `G-FS-2` Segregation of duties · `G-FS-3` Change ticket linked · `G-FS-4` Exactly-once money movement | `pci-scope`, `sox-change` | `fs-track1-data`, `fs-track2-data` |
| `public-sector` | PS | Public sector and government | `G-PS-1` Categorise before design · `G-PS-2` Controls are traced · `G-PS-3` Validated cryptography only · `G-PS-4` Section 508 conformance | `ato-readiness`, `section-508` | none |

### Standards cited

From each `profile.json`. The version is the one the profile was written against.

| Profile | Standard | Version |
|---|---|---|
| `general-saas` | SOC 2 Trust Services Criteria | 2017, revised points of focus 2022 |
| | OWASP ASVS | 5.0 |
| | GDPR | Regulation (EU) 2016/679 |
| | CCPA / CPRA | Cal. Civ. Code §1798.100 et seq., as amended by the CPRA |
| | WCAG 2.2 AA | 2.2, conformance level AA |
| `healthcare` | HIPAA Security Rule | 45 CFR Part 164 Subpart C (§164.302–318) |
| | HIPAA Privacy Rule | 45 CFR Part 164 Subpart E (§164.500–534) |
| | HIPAA Breach Notification | 45 CFR Part 164 Subpart D (§164.400–414) |
| | HL7 FHIR R4 | 4.0.1 |
| | IEC 62304 medical device software | IEC 62304:2006+A1:2015 |
| `financial-services` | PCI DSS | 4.0.1 |
| | SOX 404 ITGC | Sarbanes-Oxley Act of 2002, section 404 |
| | PSD2 SCA | Directive (EU) 2015/2366 |
| | ISO 20022 | The current message catalogue, as profiled by the scheme's usage guideline |
| | SCA RTS | Commission Delegated Regulation (EU) 2018/389 |
| `public-sector` | NIST SP 800-53 | Rev. 5 |
| | FedRAMP baselines | Rev. 5 |
| | FIPS 199 | February 2004 |
| | FIPS 140-3 | March 2019 |
| | Section 508 | Revised 508 Standards (36 CFR 1194), incorporating WCAG 2.0 AA |

Citations that the authors flagged as least certain, for the compliance owner to check first:
the OWASP ASVS 5.0 chapter numbers; the IEC 62304 sub-clauses; the paragraph split of HIPAA
§164.514(d); PCI DSS 11.4.5, 3.6.1 and 3.7; the PSD2 articles outside Article 97; and whether the
FedRAMP baseline naming is current. SOX has no control ids, so that profile cites control
families only.

## What a profile adds, per template

All four profiles fill the same slots. Ids use the profile's code, shown here as `XX`.

| Template | Slots filled | What appears |
|---|---|---|
| `constitution-template.md` | `principles`, `gates-rows`, `quality-bar-items`, `governance-items`, `annexes` | Two principles `XX-1`, `XX-2`; the gates `G-XX-n`; quality-bar and governance items; `Annex R — Regulatory controls`, a table of control → what to do → where it is evidenced |
| `spec-template.md` | `guardrails-items`, `edge-cases-items`, `nfr-rows`, `sections-after-requirements`, `review-checklist-items` | `NFR-XX-01` to `NFR-XX-06`, and the domain sections below. No technology. |
| `plan-template.md` | `technical-context-extra-rows`, `constitution-check-rows`, `test-strategy-extra-rows`, `risks-rows`, `rollout-items`, `sections-before-open-questions`, `artifacts-items` | One Constitution check row per gate; risks `R-XX-1` to `R-XX-5`; the design sections below |
| `tasks-template.md` | `conventions-items`, `sections-after-phases`, `coverage-rows`, `definition-of-done-items` | A `Regulatory tasks` table with ids `R001`…; coverage rows for the `NFR-XX` ids |
| `data-model-template.md` | `sections-before-open-questions` | Classification and retention sections |
| `checklists/security-template.md`, `privacy`, `accessibility`, `release` | Every section's `…-rows` slot | Rows `C-XX-nn`, each citing its control |
| `project/AGENTS.md` | `rules-items`, `sections-end` | Hard rules for an AI coding agent in this domain |
| `project/pull_request_template.md` | `checklist-items` | Check items for every pull request |

An industry profile never replaces a block slot. The stack layer owns the Technical context and
Test strategy rows of the plan and the command table in `AGENTS.md`, so any industry composes
with any stack.

### Domain sections

| Profile | Added to the spec | Added to the plan | Added to the data model |
|---|---|---|---|
| `general-saas` | Personal data and lawful basis · Tenant boundary · Data-subject rights · Sub-processors | Threat model (STRIDE) · Tenant isolation design · Personal data handling · Audit trail design | Tenancy · Data classification and retention |
| `healthcare` | PHI inventory · Interoperability · Software safety classification | PHI safeguards · Audit trail design · Interoperability design · Software safety and traceability · De-identification and non-production data | PHI classification · Retention, amendment and disposal |
| `financial-services` | Cardholder data scope · Money movements | Cardholder data environment impact · Money movement design · Audit trail design · Payer authentication and message conformance | Account data classification · Money and ledger rules |
| `public-sector` | Security categorisation (FIPS 199) · Boundary, residency and records | Control implementation summary · Authorisation boundary and data residency · Cryptography inventory · Audit and records design · Supply chain and configuration evidence | Data classification and records · Records retention and disposition · Residency and location |

### Own checklists

Whole files, written to `.specify/templates/overrides/checklists/`. Generate one for a feature
with `/sdd-speckit:speckit.checklist <kind>`.

| Kind | Profile | Covers |
|---|---|---|
| `soc2-change` | `general-saas` | Change authorisation, development, testing, approval, deployment and rollback evidence |
| `hipaa-safeguards` | `healthcare` | The administrative and technical safeguards of the Security Rule |
| `phi-handling` | `healthcare` | Minimum necessary, de-identification, disclosure and breach handling of PHI |
| `pci-scope` | `financial-services` | Whether the feature stores, processes or transmits account data, and the effect on scope |
| `sox-change` | `financial-services` | Change management and segregation of duties for financial systems |
| `ato-readiness` | `public-sector` | Evidence for an authorisation to operate |
| `section-508` | `public-sector` | Conformance with the Revised 508 Standards |

### Sensitive patterns

A profile can add patterns to the `secrets-scan` gate, in `harness.sensitivePatterns`. That gate
is at `block` in both project modes, so the shipped patterns are few and precise.

| Id | Profile | Matches |
|---|---|---|
| `us-ssn` | `healthcare` | A US Social Security number written with hyphens, excluding ranges that are never issued. `000-00-0000` does not match; use it in fixtures. |
| `fs-track1-data` | `financial-services` | Magnetic-stripe track 1 data |
| `fs-track2-data` | `financial-services` | Magnetic-stripe track 2 data |

No profile has a card-number pattern. It would block the documented test card numbers that
payment test suites use. See [HARNESS.md](HARNESS.md#the-harness-block) for the pragma and
`secretsAllow`.

## How the phases use a profile

| Phase | Behaviour |
|---|---|
| Constitution | Keeps the profile's gates and `Annex R`, and fills their placeholders. Removes a profile row only when you say the control does not apply, and records the reason in the amendment log. |
| Specify | Fills each section the profile added. A section that does not apply to the feature stays, with the reason. |
| Plan | Fills the profile rows and design sections, and records PASS or FAIL for each `G-XX-n` in the Constitution check. |
| Checklist | Starts from the kind's template and keeps every `C-XX-nn` row. A person marks a row not applicable, with the reason. |
| Tasks | Keeps the `R###` block. Each row gets a real file path, or the reason it does not apply. |
| Analyze | Reports each `NFR-XX`, gate or `R###` task that is neither traced to work nor marked not applicable. |
| Converge | Checks every `G-XX-n` against the shipped code. |

The constitution gates `G-XX-n` are rules for people and for the phases. They are not harness
gates: no hook checks them. The six harness gates are in [HARNESS.md](HARNESS.md).

## Tailor a profile

| Need | How |
|---|---|
| Add a control or a rule for this project | A project-local fragment in `.specify/templates/fragments/`. It is the last layer. See [TEMPLATES.md](TEMPLATES.md#project-local-fragments). |
| A control does not apply to this project | Remove its row from the constitution through `/sdd-speckit:speckit.constitution`, with the reason in the Article V amendment log. Leave the profile's fragment as it is. |
| A control does not apply to one feature | Keep the row in that feature's artifact and write "not applicable" with the reason. |
| A fixture trips a sensitive pattern | The `sdd-allow-secret` pragma on that line; or the pattern id, or a path glob, in `harness.secretsAllow` of `.specify/sdd-speckit.json`. |
| A different version of a standard | Copy the profile to a new id, change it, and set `reviewedOn`. Do not edit a composed file in `.specify/templates/overrides/`: the next compose replaces it. |
| Two industries apply | Choose the one with the stricter controls, and add the other's rows as project-local fragments. |

Do not edit `.specify/sdd-speckit/profiles/` in a project. That directory is a pinned copy and
is refreshed by the next onboarding run.

## Add an industry

1. Create `profiles/industries/<id>/profile.json`:

   ```json
   {
     "schema": 1,
     "kind": "industry",
     "id": "<id>",
     "label": "Short name",
     "description": "One sentence.",
     "code": "XX",
     "standards": [
       { "id": "std-id", "title": "Short title", "version": "…", "url": "…", "reviewedOn": "YYYY-MM-DD" }
     ],
     "checklistKinds": ["requirements", "security", "privacy", "accessibility", "release", "<own kind>"],
     "harness": { "sensitivePatterns": [ { "id": "…", "description": "…", "regex": "…" } ] }
   }
   ```

   `id` equals the directory name. Each standard needs `id`, `title` and `reviewedOn`. The
   installer shows the first four titles as the hint for the profile, so keep them short. A
   sensitive pattern is a Python `re` expression that blocks a write: prefer none to a noisy one.
   `checklistKinds` is the list of checklists a feature in this industry should have. Onboarding
   copies it to `checklistKinds` in `.specify/sdd-speckit.json`, and the checklist phase offers
   the kinds a feature still lacks. The lint rejects a kind with no template, and a profile
   that ships a checklist template without listing it.

2. Add fragments under `fragments/`, one per template, with the same relative path as the base.
   Follow the conventions in the table above: ids `G-XX-n`, `NFR-XX-nn`, `R-XX-n`, `R###`,
   `C-XX-nn`; no `replace`; no block slot; no slash command and no assistant-specific string.
   Cite the control on every row.

3. Add whole-file checklists under `templates/checklists/<kind>-template.md`. Model them on
   `templates/checklists/security-template.md`. A file name may not match a base template.

4. End `Annex R` with the statement that the content is engineering guidance, not compliance
   advice.

5. Check it:

   ```bash
   python3 scripts/compose-templates.py --lint
   python3 scripts/compose-templates.py --project /tmp/try --industry <id> --stack python-fastapi --targets claude,copilot
   cd installer/create-sdd-speckit-app && npm test && npm run render:copilot
   ```

   The lint composes the new profile with every stack. Read two or three composed files to
   confirm that each reads as one document. `render:copilot` refreshes the copy of `profiles/`
   that the GitHub Copilot target ships.

6. Have a person who knows the standard review every citation before release.
