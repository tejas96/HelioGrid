# Architecture Decision Records

Reference only — why each architecture choice was made. **Nothing here gates a change.**
New architecture → add a file here; replaced architecture → delete the old file and its row.

An ADR is deleted only after any decision it still carries has been folded into the file that
enforces it, so no citation is left pointing at nothing.

| ADR | Title |
|---|---|
| [0001](0001-monorepo-pnpm-turborepo.md) | Monorepo on pnpm workspaces + Turborepo (Turbo drives the build graph) |
| [0003](0003-contracts-ts-rest-zod3.md) | API contracts — ts-rest with Zod pinned to 3.x |
| [0004](0004-orm-drizzle.md) | ORM — Drizzle, and the single-DB + RLS-backstop tenancy it serves |
| [0007](0007-storage-tigris-single-region-sin.md) | Object storage — Tigris, single-region pin `sin` |
| [0011](0011-mobile-bare-react-native.md) | Mobile — bare React Native, iOS + Android from day one |
| [0013](0013-billing-razorpay-inhouse-entitlements.md) | Billing — Razorpay Subscriptions + in-house entitlements |
| [0015](0015-i18n-lingui-v5.md) | i18n — Lingui v5, one catalog for Next.js and bare React Native |
| [0019](0019-telephony-platform-capability-framework.md) | Telephony as a provider-agnostic capability framework |
| [0023](0023-packages-data-frontend-sdk.md) | `packages/data` — the frontend SDK |
| [0025](0025-orchestration-temporal.md) | Workflow orchestration — Temporal, superseding the BullMQ scaffold |
| [0026](0026-ui-styling-plain-css-and-stylesheet.md) | UI styling — plain CSS on web, StyleSheet on native, Tailwind for layout only |

Numbers are stable and never reused. A gap is an ADR that was removed.
