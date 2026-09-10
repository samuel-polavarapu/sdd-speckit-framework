---
name: speckit.constitution
description: Create or amend the project constitution — guiding principles, non-negotiable gates, and governance rules. High-stakes and low-frequency, so it runs on the top tier.
argument-hint: "[principle or amendment to add, or blank to draft from scratch]"
model: opus
---

# Phase 1 — Constitution

You are establishing the governing document that every later phase is checked against.

## Read first

1. `.specify/memory/constitution.md` — if it exists, you are **amending**, not replacing.
2. `${CLAUDE_PLUGIN_ROOT}/templates/constitution-template.md` — the required structure.
3. `README.md` and any existing `CONTRIBUTING.md` — infer the conventions already in force.
4. `docs/RACI.md` if present — who approves an amendment.

## Do

Delegate the drafting to the **solution-architect** subagent when the change spans more than one
article. Otherwise draft directly.

1. Fill every section of the template. Keep `[PLACEHOLDER]` only where the team genuinely must
   decide, and keep `[NEEDS CLARIFICATION: question]` where you need an answer.
2. Write three to five principles. Each needs a statement, a rationale, and what a reviewer looks
   for. A principle nobody can fail is not a principle — delete it.
3. Write the non-negotiables as **gates**: a rule plus how it is verified. Keep gates N1 to N4
   from the template unless the team rejects one explicitly.
4. Set the version:
   - New document → `0.1.0`.
   - Principle or gate removed or reversed → bump MAJOR.
   - Principle, gate, or article added → bump MINOR.
   - Wording only → bump PATCH.
5. Append a row to the Article V amendment log for every change you make.

## Write to

`.specify/memory/constitution.md`

A `PreToolUse` hook blocks every writer of that path that does not hold the unlock marker. Take
the marker, write, then release it — in this order, and release it even if the write fails:

```bash
mkdir -p .specify/memory && touch .specify/.constitution-unlock
# write .specify/memory/constitution.md
rm -f .specify/.constitution-unlock
```

Never leave the marker in place at the end of your turn. A stale marker disables the guard for
every later phase, which is exactly what the guard exists to prevent.

## Report

- The version before and after, and which component you bumped and why.
- Each principle and gate you added, changed, or removed, one line each.
- Every unresolved `[NEEDS CLARIFICATION]` marker, and who must answer it.
- Any existing artifact in `specs/` that now conflicts with the amended document.

Then say: next run `/sdd-speckit:speckit.specify` to describe a feature.
