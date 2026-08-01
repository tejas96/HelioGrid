# Architecture Decision Records

Reference only — why each architecture choice was made, for whoever wants to look it up later. Nothing here gates a change. New architecture → add a file here; replaced architecture → delete the old file and its row.

## Index

| ADR | Title |
|---|---|
| [0001](0001-monorepo-pnpm-turborepo.md) | Monorepo on pnpm + Turborepo + TS project references |
| [0002](0002-backend-nestjs-modular-monolith.md) | Backend framework — NestJS modular monolith |
| [0003](0003-contracts-ts-rest-zod3.md) | API contracts — ts-rest with Zod pinned to 3.x |
| [0004](0004-orm-drizzle.md) | ORM — Drizzle |
| [0005](0005-tenancy-single-db-rls-backstop.md) | Tenancy — single DB, `tenant_id`, app-scoping primary + RLS backstop |
| [0006](0006-database-fly-postgres-flex-bom.md) | Database — Fly postgres-flex (unmanaged) in `bom`, risk accepted with mandatory mitigations |
| [0007](0007-storage-tigris-single-region-sin.md) | Object storage — Tigris, single-region pin `sin` |
| [0008](0008-jobs-bullmq-upstash.md) | Jobs — BullMQ + Upstash Redis (fixed plan, eviction off) |
| [0009](0009-offline-sync-powersync.md) | Offline sync — PowerSync self-hosted; write path is our connector |
| [0010](0010-auth-better-auth-msg91.md) | Auth — Better Auth self-hosted + MSG91 phone OTP |
| [0011](0011-mobile-bare-react-native.md) | Mobile — bare React Native (no Expo), iOS + Android day one |
| [0012](0012-voice-exotel-sarvam.md) | Voice — Exotel + Sarvam behind a thin orchestrator; ComplianceGate ours |
| [0013](0013-billing-razorpay-inhouse-entitlements.md) | Billing — Razorpay Subscriptions + in-house entitlements; trial-only; BYO-Razorpay collections |
| [0014](0014-scale-block-model-gpu-shading.md) | Scale — block/table/zone model, GPU shadow-map shading, UTM/ENU origin |
| [0015](0015-i18n-lingui-v5.md) | i18n — Lingui v5, one catalog for web and bare RN |
| [0016](0016-no-feature-flags.md) | No feature flags — entitlements-only gating, trunk discipline |
| [0017](0017-studio-primacy-tool-census-gate.md) | Studio primacy — tool census as port acceptance gate; WebView on mobile |
| [0018](0018-fly-one-app-per-service.md) | Fly topology — one app per service (web/api/worker/voice/powersync + pg + log-shipper) |
| [0019](0019-telephony-platform-capability-framework.md) | Telephony — provider-agnostic capability framework: port family, control plane, tenant routing policies, capability-declared transfers/DTMF/conference/monitoring |
| [0020](0020-mobile-navigation-react-navigation.md) | Mobile navigation — React Navigation v7 native-stack on bare RN; typed route names replace prop callbacks; `src/navigation/` owns deep links |
| [0021](0021-packages-domain.md) | `packages/domain` — pure isomorphic domain layer; makes two inert dependency-cruiser purity rules live and gives shared decision logic a home instead of accreting in api services and duplicated screens |
| [0022](0022-web-feature-folders.md) | `apps/web` feature folders — pages route, features own the capability; `app/` is Next.js routing only, everything else lives in `apps/web/features/<feature>/` behind a barrel |

Filename `NNNN-short-slug.md`. Keep it short: what we chose, why, what it costs, what we rejected.
