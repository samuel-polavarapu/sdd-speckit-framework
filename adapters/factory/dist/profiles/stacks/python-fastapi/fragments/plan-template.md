<!-- @slot preamble -->
> Stack preset: **Python service (FastAPI)** (`python-fastapi`). Technical context and test strategy are
> pre-filled for this stack. Change a value only with a reason recorded in Key decisions.

<!-- @slot technical-context-rows replace -->
| Language and version | Python 3.12 |
| Runtime | uvicorn with uvloop |
| Primary framework | FastAPI |
| Storage | PostgreSQL 17 via SQLAlchemy 2.0, migrations by Alembic |
| Testing | pytest (unit, integration), schemathesis (contract) |
| Target platform | Linux container |
| Project type | service |
| Performance goal | [From NFR — state a p95 latency and a requests-per-second target] |
| Constraints | [Hard limits: budget, latency, compliance] |
| Scale | [Requests per second, data volume] |
| Package manager | uv with a locked `uv.lock` |

<!-- @slot test-strategy-rows replace -->
| Unit | Pure functions, Pydantic validators, domain rules | pytest | [Coverage threshold] |
| Integration | Route against a real Postgres in a container | pytest + Testcontainers | All routes in `contracts/` |
| Contract | Generated OpenAPI document, property-based | schemathesis | Every endpoint, no 500 |
| End to end | Critical flows against a running container | pytest + httpx | Every acceptance scenario in `spec.md` |
| Type | Whole package | `mypy --strict` | Zero error |

<!-- @slot sections-before-open-questions -->
## Stack conventions — FastAPI

- **Pydantic models are the contract.** FastAPI generates the OpenAPI document from them, so the
  schema and the code cannot diverge. Do not hand-write an OpenAPI file beside them.
- **Separate the request model from the ORM model.** Returning a SQLAlchemy row directly leaks
  columns you did not intend to expose.
- **Dependency injection through `Depends`,** so a test can override a dependency instead of
  monkey-patching a module.
- **`async def` only when the body actually awaits.** A blocking call inside an async route stalls
  the event loop, and the symptom looks like a capacity problem.
- **One Alembic revision per data-model change,** with a working `downgrade`.

## Container and runtime

| Field | Value |
|---|---|
| Base image | [NEEDS CLARIFICATION: distro and Python variant] |
| Worker model | [uvicorn workers, or a process manager] |
| Health endpoints | `/healthz` liveness, `/readyz` readiness |
