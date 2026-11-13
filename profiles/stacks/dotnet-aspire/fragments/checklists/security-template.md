<!-- @slot supply-chain-rows -->
| C-ST-01 | Package versions are pinned in `Directory.Packages.props`, and lock files are committed where the team uses them. | [ ] | |
| C-ST-02 | `dotnet list package --vulnerable --include-transitive` reports no high or critical finding, or each one has a recorded exception. | [ ] | |

<!-- @slot input-rows -->
| C-ST-03 | Every new endpoint validates its request model, and returns `ProblemDetails` with no internal detail. | [ ] | |
| C-ST-04 | No connection string or key is in `appsettings.json`. The AppHost passes resources by reference, and secrets come from a secret store. | [ ] | |
| C-ST-05 | EF Core queries use parameters. No query uses `FromSqlRaw` with joined input. | [ ] | |
