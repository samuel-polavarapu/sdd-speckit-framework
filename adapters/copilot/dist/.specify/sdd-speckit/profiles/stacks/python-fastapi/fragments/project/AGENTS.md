<!-- @slot commands replace -->
| Action | Command |
|---|---|
| Install | `uv sync` |
| Test | `uv run pytest` |
| Lint | `uv run ruff check .` |
| Format check | `uv run ruff format --check .` |
| Type check | `uv run mypy --strict .` |

<!-- @slot conventions -->
### Stack conventions — FastAPI

- Every route declares Pydantic request and response models. Do not return a raw dict or an ORM object.
- Dependencies come through `Depends`, so that a test can override them. Do not import a session or a client at module level.
- Change the database only through an Alembic revision with a working `downgrade`.
- Code is async from the route to the driver. Do not call a blocking client inside an async route.
- `mypy --strict` stays clean. Do not add `# type: ignore` without the error code and a reason.
