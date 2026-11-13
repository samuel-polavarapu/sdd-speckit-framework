<!-- @slot preamble -->
> Stack preset: **.NET distributed app (Aspire)** (`dotnet-aspire`). See the stack-specific task block below.

<!-- @slot sections-after-phases -->
## Stack-specific tasks — .NET Aspire

| ID | Task | File | When needed |
|---|---|---|---|
| S001 | Declare the new resource in the AppHost and wire the reference. | `src/AppHost/Program.cs` | Any new dependency |
| S002 | Add the EF Core migration. | `src/[Project]/Migrations/` | Any data-model change |
| S003 | Add the health check for the new dependency. | `src/ServiceDefaults/Extensions.cs` | Any new dependency |
| S004 | Add the `Aspire.Hosting.Testing` test that the graph starts. | `tests/[Project].Tests/AppHostTests.cs` | Any topology change |
| S005 | Add the endpoint to the OpenAPI document and diff it for breaking changes. | `src/[Project]/Api/` | Any contract change |
