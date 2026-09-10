---
name: asd-ste100
description: "Rewrite dense, hedged or ambiguous English into ASD-STE100 Simplified Technical English principles — one meaning per word, active voice, one instruction per sentence. Use as a clarity pass over a constitution, a spec, a task list, or team documentation, and over any text an agent must parse with nobody to ask. Triggers: STE100 rewrite, simplified technical english, clarity pass, plain-language rewrite, rewrite so an agent cannot misread this. Not for marketing or creative copy."
version: 0.4.0
license: MIT
---

# Simplified Technical English (ASD-STE100) — clarity pass

ASD-STE100 is a controlled-language standard from the aerospace and defense industry. It exists to
stop a maintenance technician from misreading an instruction. It removes the two largest sources
of misreading: **a word with more than one meaning**, and **a sentence with more than one possible
structure**.

Spec-Driven Development has the same problem and the same reader. A `spec.md` is parsed by an agent
and by an engineer who cannot ask the author what a sentence meant. "Close the valve" can be read
as a command or as a description of a nearby valve. So can half of a hedged requirement.

## Scope and honesty about it

This skill applies **STE principles**. It does **not** include the ASD-STE100 dictionary, which is
copyrighted by the AeroSpace and Defence Industries Association of Europe.

**Never describe the output as "STE100-certified" or "STE100-compliant."** It is a
principles-based rewrite. Say that.

## When to use it

**Use it on:**

| Target | Why |
|---|---|
| `.specify/memory/constitution.md` | A gate that can be read two ways is not a gate. |
| `spec.md` requirements and acceptance scenarios | Ambiguity here propagates into every later phase. |
| `tasks.md` task descriptions | An executor reads these with no author present. |
| `README.md`, `ONBOARDING.md`, `docs/*` | Instructional text, read by newcomers. |
| Error messages, tool descriptions, agent instructions | Parsed by a machine with nobody to ask. |

**Do not use it on:** marketing copy, design rationale, a decision log's reasoning, or anything
where nuance is the content. Flattening those loses information.

## This is a rewrite on request, not an output style

You are invoked when someone points at text. You do not rewrite everything you touch, and you do
not silently reformat a document that was not offered to you. Nothing in the Speckit workflow
requires this pass — it is a recommended gate, not a mandatory one.

## Two modes

| Mode | Trigger | Output |
|---|---|---|
| **Report** | "check", "review", "lint", "how bad is this" | Findings only. No rewrite. |
| **Rewrite** | "rewrite", "simplify", "clarity pass", "apply STE" | The rewritten text, then what changed. |

When the request is unclear, run **Report** first. A rewrite nobody asked for is harder to undo
than a finding nobody wanted.

## Core rules

### Structural — apply these

1. **One instruction per sentence.** Split a sentence with two imperatives.
2. **Active voice.** Name the actor. Use the passive only when the actor is genuinely unknown or
   irrelevant.
3. **Short sentences.** At most 20 words for an instruction, 25 for a description.
4. **One meaning per word,** used the same way everywhere in the document. Do not alternate
   "user", "operator", and "caller" for one role.
5. **Imperative for instructions.** "Run the migration", not "the migration should be run".
6. **No noun stack over three words.** Break "user account access permission check" apart.
7. **Positive form.** "The endpoint accepts a token" beats "the endpoint does not work without a
   token".
8. **Front the condition.** "If the token is absent, return 401" beats the reverse order.
9. **Simple tenses** — present, past, future. One exception: keep the present perfect where the
   completion state is the point ("the migration has run").

### Lexical — direction of travel

Prefer the short, common word. `utilize` → `use`. `in order to` → `to`. `facilitate` → `help` or
name the real action. `prior to` → `before`. `aforementioned` → `this` or the actual name. Delete
`it should be noted that` and `there is/are` openings entirely.

### What is never a violation

**Hedges and modality are content, not noise.** `may`, `might`, `could`, and `should` carry real
meaning in a spec — `MUST` and `SHOULD` are load-bearing in a requirements table. Never strip
them, and never flag them. Removing "may" from "the request may omit the field" changes the
requirement.

## Process

1. Read the whole text before changing a word. A term used consistently is not a defect even when
   it is unusual.
2. Run the linter for the mechanical findings:

   ```bash
   python3 ${CLAUDE_PLUGIN_ROOT}/skills/asd-ste100/scripts/ste-lint.py <path> [<path>...]
   # or:  cat file.md | python3 .../ste-lint.py
   # flags: --json  --baseline N  --disable rule1,rule2  --selftest
   ```

   It exits non-zero when hard findings exceed the baseline, so it works as a CI gate. It reports
   stdin when given no path.
3. Fix structure before vocabulary. A split sentence often removes the hard words with it.
4. **Preserve every requirement id, `[NEEDS CLARIFICATION]` marker, code span, path, and table
   structure, verbatim.** A clarity pass that renumbers `FR-003` or drops a marker has broken the
   document.
5. Re-read the rewrite against the original and confirm that the meaning survived. Where you are
   unsure, keep the original and flag the sentence instead.

## Output format

For **Report**: the linter output, then the judgment findings it cannot see (inconsistent
terminology, a sentence with two readings), each quoted with its location.

For **Rewrite**:

```
## Rewritten
<the rewritten text>

## Changes
| # | Original | Rewritten | Rule |

## Kept as-is
| Text | Why |
```

The **Kept as-is** table matters. It is where you record a sentence you judged too risky to touch.

## Boundaries

- Do not change a quoted requirement's meaning to make it shorter. Meaning outranks brevity.
- Do not remove a `[NEEDS CLARIFICATION]` marker. That is `/speckit.clarify`'s job, not yours.
- Do not touch code blocks, identifiers, or file paths.
- Do not add information the original did not carry. You are rewriting, not authoring.

## Additional resources

- `references/writing-rules.md` — the full rule set with examples.
- `references/before-after.md` — worked before-and-after pairs.
- `scripts/ste-lint.py` — the mechanical linter.
- `ATTRIBUTION.md` — upstream source and license.
