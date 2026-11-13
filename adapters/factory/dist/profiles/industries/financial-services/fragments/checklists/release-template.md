<!-- @slot evidence-rows -->
| C-FS-01 | `checklists/pci-scope.md` and `checklists/sox-change.md` each have a PASS verdict for the release commit (PCI DSS 12.5.2; SOX §404 ITGC). | [ ] | |
| C-FS-02 | Idempotency, reconciliation and message conformance tests pass on the release commit (constitution gate G-FS-4). | [ ] | |
| C-FS-03 | Test data, test accounts and test account numbers are removed from the release artefact (PCI DSS 6.5.6). | [ ] | |

<!-- @slot rollout-rows -->
| C-FS-04 | The plan states what happens to in-flight money movements during the rollout and during a rollback, and that path was exercised before production. | [ ] | |
| C-FS-05 | The person who deploys to production is neither the sole author nor the sole approver of the change (PCI DSS 6.5.4; SOX §404 ITGC — program changes). | [ ] | |
| C-FS-06 | For a significant change, the applicable PCI DSS requirements are confirmed in place on the changed systems and the scope documentation is updated (PCI DSS 6.5.2). | [ ] | |

<!-- @slot operations-rows -->
| C-FS-07 | The first reconciliation after release is scheduled, has a named owner and its result will be recorded (SOX §404 ITGC — computer operations). | [ ] | |
| C-FS-08 | An alert fires on a reconciliation break and on a duplicate-posting attempt, and each alert has an owner. | [ ] | |
| C-FS-09 | Audit logging is confirmed to work in production for the new events, and the logs reach the protected store (PCI DSS 10.2.1, 10.3.2). | [ ] | |

<!-- @slot signoff-rows -->
| C-FS-10 | The approved change ticket is linked, and it records impact, test evidence, approval and the back-out procedure (PCI DSS 6.5.1; SOX §404 ITGC — program changes). | [ ] | |
| C-FS-11 | The compliance owner has signed off any waiver of gates G-FS-1 to G-FS-4. | [ ] | |
