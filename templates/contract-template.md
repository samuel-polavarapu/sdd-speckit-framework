# Contract: [CONTRACT NAME]

**Plan:** `../plan.md` · **Kind:** [REST / GraphQL / gRPC / event / CLI / file] · **Status:** Draft
**Owner:** [Team or role] · **Version:** [MAJOR.MINOR]

Write the machine-readable definition in the format the stack uses (OpenAPI, AsyncAPI, protobuf,
JSON Schema) next to this file. This file states what that definition cannot: who relies on it,
and what may change.

## Purpose

[One sentence. What a consumer gets from this interface.]

## Consumers

| Consumer | Uses | Breaks if |
|---|---|---|
| [System or team.] | [Operations or events.] | [The change that breaks them.] |

## Operations

| Operation | Input | Output | Errors | Idempotent | Requirement |
|---|---|---|---|---|---|
| `[verb or event name]` | [Shape, or schema reference.] | [Shape, or schema reference.] | [Error codes.] | [yes / no] | FR-001 |

## Authentication and authorization

- **Caller identity:** [How the caller proves who it is.]
- **Permission:** [What the caller must be allowed to do, per operation.]

## Error model

| Code | Meaning | Caller should |
|---|---|---|
| [Code.] | [When it happens.] | [Retry / fix the request / stop.] |

## Limits

| Limit | Value | On breach |
|---|---|---|
| [Rate, payload size, page size, timeout.] | [Number and unit.] | [Response.] |

## Compatibility

- **Versioning:** [Where the version lives: path, header, schema field.]
- **Additive change:** allowed without a version bump. A consumer must ignore unknown fields.
- **Breaking change:** [The rule: new major version, deprecation window of N days, named approver.]
- **Deprecation notice:** [Where it is announced, and how far ahead.]

## Contract test

| Check | Tool | Runs |
|---|---|---|
| The provider matches the definition. | [Tool.] | [On every PR.] |
| No breaking change against the last released version. | [Tool.] | [On every PR.] |

<!-- slot:sections-end -->
