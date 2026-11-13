---
name: speckit.constitution
description: Create or amend the project constitution — guiding principles, non-negotiable gates, and governance rules. High-stakes and low-frequency, so it runs on the top tier.
argument-hint: "[principle or amendment to add, or blank to draft from scratch]"
model: opus
---

# Phase 1 — Constitution

You are establishing the governing document that every later phase is checked against.

## Templates

For every template this phase names, use `.specify/templates/overrides/<file>` when it exists,
otherwise `${CLAUDE_PLUGIN_ROOT}/templates/<file>`. An override is the base template composed
with the project's industry and stack profiles, so it wins. A line of the form
`<!-- slot:… -->` is a composition marker: never copy it into an artifact.

## Read first

1. `.specify/memory/constitution.md` — if it exists, you are **amending**, not replacing.
2. `constitution-template.md` — the required structure. An industry profile adds its gates and a
   regulatory annex to it; a stack profile adds a technology annex.
3. `README.md` and any existing `CONTRIBUTING.md` — infer the conventions already in force.
4. `docs/RACI.md` if present — who approves an amendment.
5. `.specify/sdd-speckit.json` → `mode`, and `.specify/discovery/report.md`. In a brownfield
   project the principles come from the report.

## Do

Delegate the drafting to the **solution-architect** subagent when the change spans more than one
article. Otherwise draft directly.

1. Fill every section of the template. Keep `[PLACEHOLDER]` only where the team genuinely must
   decide, and keep `[NEEDS CLARIFICATION: question]` where you need an answer.
2. Write three to five principles. Each needs a statement, a rationale, and what a reviewer looks
   for. A principle nobody can fail is not a principle — delete it.
3. Write the non-negotiables as **gates**: a rule plus how it is verified. Keep gates N1 to N4
   from the template unless the team rejects one explicitly.
4. **Brownfield: derive, do not invent.** When a discovery report exists, draft each principle
   from a convention the report records at high or medium confidence, and cite its evidence. End
   the In practice line of every principle, and the Rule of every gate, with **(observed)** — the
   code already does it — or **(aspirational)** — it is not true yet. An aspirational gate is
   allowed: the adoption roadmap plans when it starts to block. When a principle the user wants
   contradicts observed practice, ask which one wins. Do not decide it yourself.
5. Keep what a profile supplied: gates `G-<XX>-n`, the added quality-bar and governance items,
   and `Annex R` and `Annex T`. Fill their placeholders. Remove a profile row only when the user
   says the control does not apply, and record the reason in the amendment log.
6. Set the version:
   - New document → `0.1.0`.
   - Principle or gate removed or reversed → bump MAJOR.
   - Principle, gate, or article added → bump MINOR.
   - Wording only → bump PATCH.
7. Append a row to the Article V amendment log for every change you make.

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

Then say: next run `/sdd-speckit:speckit.specify` to describe a feature. In a brownfield project
with no baseline yet, say: run `/sdd-speckit:speckit.baseline` first.
