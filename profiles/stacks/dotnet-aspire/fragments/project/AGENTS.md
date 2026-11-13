<!-- @slot commands replace -->
| Action | Command |
|---|---|
| Install | `dotnet restore` |
| Build | `dotnet build -warnaserror` |
| Test | `dotnet test` |
| Format check | `dotnet format --verify-no-changes` |
| Run the application graph | `dotnet run --project src/AppHost` |

<!-- @slot conventions -->
### Stack conventions — .NET Aspire

- The AppHost owns the topology. Declare each resource there and pass it by reference. Never hard-code a connection string in a service.
- Health checks, telemetry, service discovery and resilience come from the shared `ServiceDefaults` project. Do not add them again in a service.
- EF Core migrations run from the migration service or an explicit step, never on service start.
- Package versions live in `Directory.Packages.props`, not in a `.csproj`.
- Nullable reference types and warnings-as-errors stay on. Do not suppress them in a file.
