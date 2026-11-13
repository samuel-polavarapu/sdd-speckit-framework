<!-- @slot identity-rows -->
| C-GS-01 | Every new or changed access path takes the tenant identity from the authenticated session, never from a caller-supplied value (SOC 2 CC6.1; ASVS 5.0 V8). | [ ] | |
| C-GS-02 | A negative cross-tenant test exists for each new access path, covering read, write, list, search and export (SOC 2 CC6.1). | [ ] | |
| C-GS-03 | New roles and permissions follow least privilege, and the plan's role matrix lists each denied case (SOC 2 CC6.3; ASVS 5.0 V8). | [ ] | |
| C-GS-04 | Staff access to tenant data is approved, time-limited and logged, or the feature adds no such access (SOC 2 CC6.2, CC6.3). | [ ] | |

<!-- @slot input-rows -->
| C-GS-05 | No request field lets a caller set or change the tenant or owner of a record (ASVS 5.0 V2, V8). | [ ] | |
| C-GS-06 | Error and "not found" responses do not reveal whether a record exists in another tenant (ASVS 5.0 V16). | [ ] | |

<!-- @slot data-rows -->
| C-GS-07 | Caches, queues, search indexes and object storage used by the feature are keyed or partitioned per tenant (SOC 2 CC6.1). | [ ] | |
| C-GS-08 | Customer data is encrypted in transit and at rest, and the plan states how keys are managed (SOC 2 CC6.1, CC6.7; ASVS 5.0 V11, V12). | [ ] | |
| C-GS-09 | Audit records for privileged actions carry the tenant and the actor, and cannot be changed by the actor (SOC 2 CC7.2; ASVS 5.0 V16). | [ ] | |

<!-- @slot supply-chain-rows -->
| C-GS-10 | The plan's STRIDE threat model has a row, or a "not applicable" with a reason, for each category at each new trust boundary (GDPR Art. 25; ASVS 5.0 V15). | [ ] | |
| C-GS-11 | Per-tenant quotas or rate limits protect each new shared resource from one tenant's load (SOC 2 A1.1). | [ ] | |
| C-GS-12 | Each new vendor or hosted service has a completed risk assessment before it is used (SOC 2 CC9.2). | [ ] | |
