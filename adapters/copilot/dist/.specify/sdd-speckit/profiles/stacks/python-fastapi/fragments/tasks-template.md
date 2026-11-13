<!-- @slot preamble -->
> Stack preset: **Python service (FastAPI)** (`python-fastapi`). See the stack-specific task block below.

<!-- @slot sections-after-phases -->
## Stack-specific tasks — FastAPI

| ID | Task | File | When needed |
|---|---|---|---|
| S001 | Add the Pydantic request and response models. | `app/schemas/[name].py` | Any new endpoint |
| S002 | Add the Alembic revision, with a working `downgrade`. | `alembic/versions/` | Any data-model change |
| S003 | Add the schemathesis contract check for the new route. | `tests/contract/test_[name].py` | Any contract change |
| S004 | Add the `Depends` override fixture so the route is testable. | `tests/conftest.py` | Any new dependency |
| S005 | Confirm `mypy --strict` is clean over the new module. | — | Every task |
