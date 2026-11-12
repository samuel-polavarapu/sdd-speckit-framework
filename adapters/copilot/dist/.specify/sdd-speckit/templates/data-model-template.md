# Data model: [FEATURE NAME]

**Plan:** `./plan.md` · **Created:** [YYYY-MM-DD]

## Entities

### [EntityName]

[One sentence: what this represents in the domain.]

| Field | Type | Required | Default | Constraint | Note |
|---|---|---|---|---|---|
| `id` | [type] | yes | [generated] | primary key | [Note.] |
| `[field]` | [type] | [yes/no] | [default] | [constraint] | [Note.] |
| `created_at` | timestamp | yes | now | | [Timezone policy.] |

**Invariants**

- [Statement that is always true of a valid record.]

**Lifecycle:** [created] → [states] → [terminal state]. Deletion policy: [hard / soft / never].

### [EntityName2]

[One sentence.]

| Field | Type | Required | Default | Constraint | Note |
|---|---|---|---|---|---|
| `id` | [type] | yes | [generated] | primary key | |

**Invariants**

- [Statement.]

## Relationships

| From | To | Cardinality | On delete | Note |
|---|---|---|---|---|
| [Entity] | [Entity] | [1:1 / 1:N / N:M] | [cascade / restrict / null] | [Note.] |

## Validation rules

| # | Rule | Enforced at | Error |
|---|---|---|---|
| V1 | [Rule.] | [layer] | [Message the caller sees.] |

## Indexes and access patterns

| Access pattern | Frequency | Index | Note |
|---|---|---|---|
| [Query described in words.] | [Per second or per day.] | [Fields.] | [Note.] |

## Migration

- **Forward:** [What the migration does.]
- **Backward:** [The revert, or "not reversible" and the reason.]
- **Backfill:** [Needed or not. If needed, the volume and the plan.]

## Open questions

| # | Question | Blocks |
|---|---|---|
| Q1 | [NEEDS CLARIFICATION: question] | [What.] |
