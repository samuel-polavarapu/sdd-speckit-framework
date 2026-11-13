<!-- @slot supply-chain-rows -->
| C-ST-01 | `uv.lock` is committed, and CI installs with `uv sync --frozen`. | [ ] | |
| C-ST-02 | A dependency audit (`pip-audit` or equivalent) reports no high or critical finding, or each one has a recorded exception. | [ ] | |

<!-- @slot input-rows -->
| C-ST-03 | Every new route declares Pydantic request and response models, and the response model excludes internal fields. | [ ] | |
| C-ST-04 | No SQL is built by string formatting. Queries use bound parameters or the ORM. | [ ] | |
| C-ST-05 | Settings come from the environment through one settings class. No default value is a real secret. | [ ] | |
