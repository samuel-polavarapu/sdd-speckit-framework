<!-- @slot preamble -->
> Stack preset: **.NET distributed app (Aspire)** (`dotnet-aspire`). Technical context and test strategy are
> pre-filled for this stack. Change a value only with a reason recorded in Key decisions.

<!-- @slot technical-context-rows replace -->
| Language and version | C# 13 on .NET 9 |
| Runtime | ASP.NET Core, orchestrated by .NET Aspire |
| Primary framework | .NET Aspire AppHost + Minimal APIs |
| Storage | [SQL Server or PostgreSQL] via EF Core 9 |
| Testing | xUnit (unit), Testcontainers (integration), Aspire.Hosting.Testing (distributed) |
| Target platform | Linux container, Azure Container Apps or Kubernetes |
| Project type | service |
| Performance goal | [From NFR — state a p95 latency and a throughput target] |
| Constraints | [Hard limits: budget, latency, compliance] |
| Scale | [Requests per second, data volume] |
| Package manager | NuGet with central package management in `Directory.Packages.props` |

<!-- @slot test-strategy-rows replace -->
| Unit | Domain logic, validators, mappers | xUnit + FluentAssertions | [Coverage threshold] |
| Integration | Endpoint against a real database container | Testcontainers | All endpoints in `contracts/` |
| Distributed | The whole AppHost graph, service to service | `Aspire.Hosting.Testing` | Every service dependency resolves |
| Contract | Generated OpenAPI document | `Microsoft.AspNetCore.OpenApi` + a schema diff | No breaking change |
| Architecture | Project reference rules | NetArchTest | No layering violation |

<!-- @slot sections-before-open-questions -->
## Stack conventions — .NET Aspire

- **The AppHost owns the topology.** Every resource — database, cache, queue, project — is declared
  in the AppHost, and consumers receive it by reference. Never hard-code a connection string in a
  service.
- **Service defaults go in the shared `ServiceDefaults` project**: health checks, OpenTelemetry,
  service discovery, resilience handlers. Do not re-add them per service.
- **EF Core migrations run from a dedicated migration service or an explicit step**, never
  automatically on service start. An automatic migration on start makes a rollback unsafe.
- **Central package management.** Versions live in `Directory.Packages.props`, not in each
  `.csproj`.
- **Nullable reference types and warnings-as-errors stay on.** Do not suppress them per file.

## Resources declared in the AppHost

| Resource | Kind | Consumed by |
|---|---|---|
| [name] | [postgres / redis / project / queue] | [services] |
