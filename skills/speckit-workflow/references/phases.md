# Phase reference — entry conditions, exit conditions, failure modes

## 1. Constitution — `/sdd-speckit:speckit.constitution`

**Entry:** A new project, or an amendment the team has agreed to.
**Exit:** Three to five principles, gates N1–N4 present, a version, an amendment-log row.
**Common failure:** Principles nobody can fail. "Write good code" is not a gate. A gate states a
rule and how it is verified.

## 2. Specify — `/sdd-speckit:speckit.specify`

**Entry:** A feature request in plain language.
**Exit:** `spec.md` with testable requirements, Given/When/Then scenarios, an explicit scope
boundary, and every unknown marked.
**Common failure:** Implementation detail leaks in. A framework name in a spec means the author
skipped ahead to `plan`. Move it to a note.

## 3. Clarify — `/sdd-speckit:speckit.clarify`

**Entry:** A `spec.md` with open markers.
**Exit:** No marker open, or every remaining one recorded with an owner. A `## Clarifications`
section logs each decision and its date.
**Common failure:** Asking several questions at once, or asking open questions. One closed
question at a time, with a recommendation.

## 4. Plan — `/sdd-speckit:speckit.plan`

**Entry:** A `spec.md` with no architectural ambiguity.
**Exit:** `plan.md` plus `research.md`, `data-model.md`, `contracts/`, `quickstart.md`. Constitution
check recorded twice — before and after design.
**Common failure:** Designing around a guess. If a marker affects the architecture, this phase
must refuse to start.

## 5. Checklist — `/sdd-speckit:speckit.checklist`

**Entry:** `spec.md` and `plan.md` exist.
**Exit:** A checklist of at most fifteen yes-or-no items, every status cell empty, the gated phase
named.
**Common failure:** The agent answers its own checklist. A gate the author signs off is not a gate.

## 6. Tasks — `/sdd-speckit:speckit.tasks`

**Entry:** `plan.md` exists, gates green, no open marker.
**Exit:** `tasks.md` in five phases, tests before implementation, every task with a file path, and
a requirement-coverage table with no empty cell.
**Common failure:** `[P]` on two tasks that touch the same file. Parallel means different files,
not independent intent.

## 7. Analyze — `/sdd-speckit:speckit.analyze`

**Entry:** `spec.md`, `plan.md`, `tasks.md` all exist.
**Exit:** A report in the conversation. **No file is created or changed.**
**Common failure:** Fixing what it finds. The write tools are removed for this command precisely
so a helpful instinct cannot corrupt a read-only audit.

## 8. Implement — `/sdd-speckit:speckit.implement`

**Entry:** `tasks.md` exists, and the target task's dependencies are done.
**Exit:** Tasks ticked, suite green, every deviation from the plan reported.
**Common failure:** Writing the implementation first and the test after. Also grinding on a bug
past two attempts instead of escalating the model tier.

## 9. Converge — `/sdd-speckit:speckit.converge`

**Entry:** Code shipped for this spec.
**Exit:** Every requirement classified implemented, partial, missing, or drifted, and gap-filling
tasks appended with append-only ids.
**Common failure:** Reading `plan.md` instead of the source. This phase exists to compare intent
against what shipped, so it must read what shipped.
