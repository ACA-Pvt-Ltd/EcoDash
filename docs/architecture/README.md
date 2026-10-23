# EcoDash Architecture Documentation

Evidence-based architecture documentation for the EcoDash repository (mobile app, admin portal, REST API). It was written from the source code at commit `66d077c` (2026-10-21).

## Start here

| Document | Read it when you need to… |
|---|---|
| [system-architecture.md](system-architecture.md) | Understand the whole system. This is the primary document: it stands on its own and has all 23 sections plus the risk register and traceability matrix. |
| [data-flow.md](data-flow.md) | Follow data through a specific workflow (Level-2 DFDs for auth, both marketplaces, QR drop-off, redemption, admin deletion). |
| [database.md](database.md) | Look up a collection, field, index or constraint (full attribute-level ERD and CRUD lifecycle). |
| [api-architecture.md](api-architecture.md) | Find an endpoint, its guard, its handler and its caller (full inventory of 98 routes), or the error model. |
| [security-architecture.md](security-architecture.md) | Review controls, vulnerabilities and what still needs runtime verification. |
| [deployment-architecture.md](deployment-architecture.md) | Build, configure or release any of the three apps. |

## Where each diagram lives
Each diagram appears once. The primary document has the overview diagrams; the companion files have the detailed ones.

| Diagram | Location |
|---|---|
| System context; high-level architecture | [system-architecture.md §5](system-architecture.md#5-high-level-system-architecture) |
| Backend component diagram; cross-app module dependency diagram | [system-architecture.md §6](system-architecture.md#6-component-and-module-architecture) |
| DFD Level 0 and Level 1 | [system-architecture.md §8](system-architecture.md#8-data-flow-diagrams) |
| DFD Level 2 (six workflows) | [data-flow.md](data-flow.md) |
| ERD overview / full ERD | [system-architecture.md §11.3](system-architecture.md#113-entity-relationship-overview) / [database.md](database.md#full-erd) |
| Request lifecycle (success and failure) | [system-architecture.md §9](system-architecture.md#9-application-request-lifecycle) |
| Mobile and portal authentication sequences | [system-architecture.md §12](system-architecture.md#12-authentication-and-authorization) |
| External integrations | [system-architecture.md §13](system-architecture.md#13-external-integrations) |
| Deployment and network topology | [system-architecture.md §14](system-architecture.md#14-deployment-and-infrastructure-architecture) |
| Build and release workflow | [deployment-architecture.md §4](deployment-architecture.md#4-build-and-release-workflow-as-practised-inferred-from-files) |
| Trust boundaries / authorisation enforcement points | [system-architecture.md §15](system-architecture.md#15-security-architecture) / [security-architecture.md §4](security-architecture.md#4-authorisation-enforcement-points) |
| Testing architecture | [system-architecture.md §17](system-architecture.md#17-testing-architecture) |
| User→collector deal sequence and state activity | [system-architecture.md §19](system-architecture.md#19-important-end-to-end-workflows) |
| QR drop-off, media upload, chat sequences | [api-architecture.md](api-architecture.md#request-flow-sequences) |

All diagrams are [Mermaid](https://mermaid.js.org/) and render on GitHub and in VS Code's Markdown preview with Mermaid support. They were checked with `@mermaid-js/mermaid-cli` 11.4.2.

## Evidence labels

| Label | Meaning |
|---|---|
| **[V] Verified** | Read in source or configuration |
| **[I] Inferred** | Strongly implied by the code, but not proven |
| **[U] Unknown** | Not determinable from the repository (cloud settings, deployed rules, secrets) |
| **[R] Recommended** | Proposed improvement, not an existing capability |

## Related documents (outside this folder)
- [CLAUDE.md](../../CLAUDE.md): developer quick reference. Note: its "no test suite" statement is out of date (see SAD §23.3).
- [FEATURES.md](../../FEATURES.md): per-screen feature walkthrough (its uploads section is stale).
- [SRS_EcoDash.md](../../SRS_EcoDash.md): requirements specification.
- [admin-portal-functions.md](../../admin-portal-functions.md): admin capability matrix.
- [docs/EcoDash-Overview.md](../EcoDash-Overview.md): business overview.

## Keeping this current
When a change alters routes, models, integrations or deployment, update the matching companion file and the traceability matrix in SAD §23.4. Re-run the validation described in SAD §23.5.
