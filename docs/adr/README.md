# Architecture Decision Records

Decisions that are expensive to reverse, recorded at the moment they were made, with the evidence that made them.

**Authority order:** the Laws (docs/17) → product truth (docs/product + the docs/15 overlay) → **ADRs + docs/02 + docs/03** → module docs. An ADR is dated, so where an ADR and a prose doc disagree, **the ADR wins** — and where code and an ADR disagree, stop and reconcile the ADR first.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-monorepo-pnpm-turborepo.md) | Monorepo on pnpm + Turborepo + TS project references | Accepted |
| [0002](0002-backend-nestjs-modular-monolith.md) | Backend framework — NestJS modular monolith | Accepted |
| [0003](0003-contracts-ts-rest-zod3.md) | API contracts — ts-rest with Zod pinned to 3.x | Accepted |
| [0004](0004-orm-drizzle.md) | ORM — Drizzle | Accepted |
| [0005](0005-tenancy-single-db-rls-backstop.md) | Tenancy — single DB, `tenant_id`, app-scoping primary + RLS backstop | Accepted |
| [0006](0006-database-fly-postgres-flex-bom.md) | Database — Fly postgres-flex (unmanaged) in `bom`, risk accepted with mandatory mitigations | Accepted |
| [0007](0007-storage-tigris-single-region-sin.md) | Object storage — Tigris, single-region pin `sin` | Accepted |
| [0008](0008-jobs-bullmq-upstash.md) | Jobs — BullMQ + Upstash Redis (fixed plan, eviction off) | Accepted |
| [0009](0009-offline-sync-powersync.md) | Offline sync — PowerSync self-hosted; write path is our connector | Accepted |
| [0010](0010-auth-better-auth-msg91.md) | Auth — Better Auth self-hosted + MSG91 phone OTP | Accepted |
| [0011](0011-mobile-bare-react-native.md) | Mobile — bare React Native (no Expo), iOS + Android day one | Accepted |
| [0012](0012-voice-exotel-sarvam.md) | Voice — Exotel + Sarvam behind a thin orchestrator; ComplianceGate ours | Accepted |
| [0013](0013-billing-razorpay-inhouse-entitlements.md) | Billing — Razorpay Subscriptions + in-house entitlements; trial-only; BYO-Razorpay collections | Accepted |
| [0014](0014-scale-block-model-gpu-shading.md) | Scale — block/table/zone model, GPU shadow-map shading, UTM/ENU origin | Accepted |
| [0015](0015-i18n-lingui-v5.md) | i18n — Lingui v5, one catalog for web and bare RN | Accepted |
| [0016](0016-no-feature-flags.md) | No feature flags — entitlements-only gating, trunk discipline | Accepted |
| [0017](0017-studio-primacy-tool-census-gate.md) | Studio primacy — tool census as port acceptance gate; WebView on mobile | Accepted |
| [0018](0018-fly-one-app-per-service.md) | Fly topology — one app per service (web/api/worker/voice/powersync + pg + log-shipper) | Accepted |
| [0019](0019-telephony-platform-capability-framework.md) | Telephony — provider-agnostic capability framework: port family, control plane, tenant routing policies, capability-declared transfers/DTMF/conference/monitoring | Accepted |
| [0020](0020-mobile-navigation-react-navigation.md) | Mobile navigation — React Navigation v7 native-stack on bare RN; typed route names replace prop callbacks; `src/navigation/` owns deep links | Accepted |
| [0021](0021-packages-domain.md) | `packages/domain` — pure isomorphic domain layer; makes two inert dependency-cruiser purity rules live and gives shared decision logic a home instead of accreting in api services and duplicated screens | Accepted |

## When to write an ADR

Write one **before implementation** whenever a choice is architectural or expensive to reverse — anything that would take more than a day to unwind once code depends on it. Concretely: adding/replacing a framework, datastore, vendor, or protocol; changing the tenancy, auth, money, or sync model; breaking a package boundary rule; superseding a product decision (D1–D39). Do NOT write ADRs for reversible implementation detail (a component library choice inside one screen, a refactor that changes no contract).

Rules:

- **Format** (every file): `# ADR-NNNN: title` / `Status:` / `Date:` / `## Context` (2–4 sentences) / `## Decision` (decisive — one recommendation, no options-to-consider) / `## Consequences` (honest, including the negatives) / `## Alternatives rejected` (with reasons) / `## Sources` (research file paths + URLs).
- **Numbering** is sequential and never reused. Filename: `NNNN-short-slug.md`.
- **Never edit an accepted decision.** To change one, write a new ADR that supersedes it, set the old ADR's Status to `Superseded by ADR-NNNN`, and update this index.
- Cite evidence: research corpus files by relative path (`../research/<file>.md`) plus primary URLs. A decision without sources is an opinion.
- Add the new ADR to the index table above in the same commit.
