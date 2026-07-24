# 03 — Tech Stack: Choices, Pins, Rejections

Every technology in HelioGrid, one decision per layer. Each table row records the choice, the
version pin, why it won, and what lost. Where a user directive overrode a research
recommendation, the row says so — the directive wins, the research stays cited.

**Pin policy.** pnpm with `save-prefix=''` — exact versions in every `package.json`; the
lockfile is the single authority. Pins below are the July-2026-verified baselines; the
scaffold PR locks the exact patch and any later major bump requires an ADR in `docs/adr/`.
`sherif` fails CI on cross-package version drift, so one version of everything, everywhere.

Binding context: BLUEPRINT.md final-review directives — NestJS backend; Fly-native services
only (no AWS); bare React Native (no Expo); billing IS in v1 (D38 superseded); no feature
flags; the 3D studio is the flagship and is never compromised.

---

## 1. Runtime

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Server runtime | **Node.js 22 LTS** (22.x, `.nvmrc` + `engines` enforced) | BLUEPRINT directive; the ecosystem-validated baseline for every native dependency we carry (Playwright, op-sqlite toolchain, OTel, BullMQ); maintenance LTS into 2027 | Bun (BullMQ/NestJS/OTel edge cases unproven for a next-month launch) · Deno (ecosystem gaps for Nest/Drizzle tooling) · Node 24 (newer LTS but 22 is the validated baseline across our toolchain; revisit at first post-launch runtime bump) |

Sources: [./research/backend.md](./research/backend.md).

## 2. Monorepo

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Package manager | **pnpm** 10.x workspaces | Strict node_modules, fast, standard | npm/yarn (weaker workspace hygiene) |
| Task runner | **Turborepo** 2.x (≥2.4 for Boundaries) | Truth lives in plain `package.json` + `turbo.json` — deterministic and legible for AI agents; free/self-hostable remote cache | Nx (project.json/executors/inferred graph = magic agents must reverse-engineer; Nx Cloud is credit-metered) · moon (~50k weekly downloads — too thin an ecosystem/training corpus) |
| Type graph | **TypeScript** 5.8.x **project references**, ship source | Incremental `tsc -b`, hard type boundaries between `domain`/`contracts`/`db`/`ui`; Next.js and Metro bundle source downstream — references exist purely for typecheck ordering + boundaries | Single bundler-mode graph (no enforced boundaries) · pre-built dist packages (slower loop, stale-artifact bugs) |

Sources: [./research/tooling.md](./research/tooling.md) · [Turborepo Boundaries](https://turborepo.com/docs/reference/boundaries) · [TS monorepo 2026](https://hsb.horse/en/blog/typescript-monorepo-best-practice-2026/).

## 3. Lint, format, boundaries

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Lint + format | **Biome v2.5** (one binary, one `biome.json`) | 20–100× faster than ESLint+Prettier, import sorting built in, 500 stable rules, `noRestrictedImports` (used to ban `zod/v4` imports — see §4) | ESLint v9 + Prettier (flat-config + FlatCompat + two-tool coordination = non-determinism agents trip on) |
| Layer rules | **dependency-cruiser** ^16 (`.dependency-cruiser.js`) | Encodes the sacred rules as config-as-code: `domain` never imports `db`/`api`/`ui`; no cycles; no orphans. One CI command | eslint-plugin-boundaries, Nx enforce-module-boundaries, Sheriff (@softarc) — all drag the ESLint runtime back in |
| Version drift | **sherif** (QuiiBz) latest | Zero-config Rust binary; catches a dep bumped in one package but not others | syncpack (config burden). NB naming trap: **sherif** = version linter (ours); **Sheriff** = ESLint boundary tool (not ours) |
| Package encapsulation | **Turborepo Boundaries** | Flags imports outside package dirs and undeclared deps; tag rules for who-may-depend-on-whom | Covered above — no extra tool |

Together: Biome (style/correctness) + dependency-cruiser (semantic layers) + sherif (versions) + Boundaries (physical encapsulation), all without an ESLint runtime.

Sources: [./research/tooling.md](./research/tooling.md) · [Biome v2.5](https://biomejs.dev/blog/biome-v2-5/) · [sherif](https://github.com/QuiiBz/sherif/blob/main/README.md).

## 4. Backend framework & API contracts

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Framework | **NestJS** 11.x — `apps/api` (modular monolith), `apps/worker`, `apps/voice` (standalone apps) | **User directive** (BLUEPRINT final review). Modular-monolith module layout maps 1:1 to product domains; mature guards/pipes/interceptors carry authz, validation, rate limiting | Hono (research's original pick — overridden by directive) · Fastify-bare (no module system for a 13-module monolith) · Next.js-only API (RN cannot call server actions; webhooks/public links/workers need a real HTTP surface) |
| Contract layer | **ts-rest** — `@ts-rest/core` + `@ts-rest/nest` + `@ts-rest/open-api` **3.52.1** | The one Nest-native contract-first option giving BOTH end-to-end typed clients (Next.js + bare RN, no codegen drift) AND emitted OpenAPI 3.1 (customer links, webhooks, future public API). CommonJS-friendly — no ESM migration tax | **@orpc/nest** (official but beta: ESM-only, Fastify path-param bugs, no one-command client emit; re-check in 6 months) · tRPC v11 (cannot emit OpenAPI) · nestjs-zod+openapi-ts alone (generated clients drift from source) |
| Validation | **Zod pinned 3.25.x** (v3 API only) + **nestjs-zod 3.x** for DTO pipes | ts-rest Zod-4 support is `3.53.0-rc.1` — still RC. We pin Zod 3 until 3.53 is stable; Biome `noRestrictedImports` bans `zod/v4` subpath imports so nobody drifts early | Zod 4 now (contract layer would sit on an RC) · class-validator (decorator duplication of the contract schemas) |
| Client binding | **@ts-rest/react-query** 3.52.1 (+ TanStack Query 5.x) on web and RN | One typed client from the same contract on both surfaces | Hand-rolled fetch wrappers (untyped drift) |
| Realtime | **SSE** (Nest-native) for notifications + design-staleness push | HTTP-native, auto-reconnect, no sticky sessions, passes the Fly proxy cleanly | WebSockets (only if collaborative editing lands — not v1) |

Ruling: the contract package (`packages/contracts`) is edited BEFORE any endpoint or client —
the contract diff is the API review surface (see CLAUDE.md hard rules).

Sources: [./research/verify-nestContracts.md](./research/verify-nestContracts.md) · [./research/backend.md](./research/backend.md) · [ts-rest Nest](https://ts-rest.com/server/nest) · [ts-rest changelog](https://ts-rest.com/changelog) · [nestjs-zod](https://github.com/BenLorantfy/nestjs-zod).

## 5. ORM

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| ORM | **Drizzle ORM** 0.44.x + drizzle-kit 0.31.x (lock exact at scaffold) | SQL-first: Postgres RLS (`SET LOCAL app.tenant_id`) is natural, the emitted SQL is inspectable by agents, and `drizzle-zod` bridges tables straight into the Zod contract schemas — one schema powering DB, validation, types, OpenAPI | Prisma 7 (much improved — rust-free, 3× faster — but RLS is still a session-variable bolt-on and migrations are a black box; explicit multi-tenant SQL wins) · Kysely (query builder only; no schema/migration story to match) |

Migrations are append-only (`packages/db`); never edit an applied migration.

Sources: [./research/backend.md](./research/backend.md) · [drizzle-zod](https://orm.drizzle.team/docs/zod) · [Drizzle RLS multitenancy](https://ecosire.com/blog/drizzle-orm-postgres-rls-multitenancy).

## 6. Database

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Database | **PostgreSQL 16** on **Fly postgres-flex (unmanaged), 3 nodes, `bom` (Mumbai)** | **User directive**: Fly-native only. Data (incl. phone PII) stays in India; single-digit-ms latency from `bom` Machines over 6PN; plain Postgres = zero lock-in | Fly MPG (NO `bom` region — Mumbai absent from all ~12 MPG regions; `sin` = data leaves India + ~60 ms/query) · Crunchy Bridge / Supabase `ap-south-1` (research's managed picks — excluded by no-AWS/Fly-native directive; retained as escape hatch) · Neon (no Mumbai, cold starts) |

⚠️ **Deprecation risk — carried verbatim from BLUEPRINT.md (binding):**

> **DB: Fly postgres-flex (unmanaged) in bom — ⚠️ flagged risk: Fly has DEPRECATED unmanaged
> Postgres (self-support only; wal-g not bundled).** User chose Fly-native; mitigations are
> MANDATORY and in-scope for the 20-day build: 3-node repmgr HA; **two backup layers → Tigris**
> (pgBackRest/Barman WAL archiving + nightly `pg_dump` logical dumps); restore drill before
> launch and monthly; disk/replication/OOM alerts; documented escape hatches (Fly MPG in
> `sin`, or external managed Mumbai Postgres) via logical replication — plain Postgres,
> nothing locks in. Revisit at scale.

Operational facts verified: repmgr HA on postgres-flex works; wal-g is NOT bundled (was only
in the old stolon image); Barman PITR needs manual `barman -q cron` and `fly clone` has
failed after Barman recovery — hence the second (logical dump) layer and the mandatory
restore drills. Runbook lives in `docs/09-observability-and-ops.md`.

Sources: [./research/verify-flyNative.md](./research/verify-flyNative.md) · [./research/fly.md](./research/fly.md) · [postgres-flex](https://github.com/fly-apps/postgres-flex) · [Fly PG what-you-should-know](https://fly.io/docs/postgres/getting-started/what-you-should-know/) · [Barman PITR thread](https://community.fly.io/t/point-in-time-recovery-for-postgres-flex-using-barman/13185).

## 7. Queue & background jobs

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Queue | **BullMQ 5.x + @nestjs/bullmq 11.x** | NestJS-idiomatic processors in `apps/worker`; repeatable jobs cover all cron sweeps (proposal-unopened-3d, task-overdue-2d, snooze wake-ups, dormant sweep) | Graphile Worker (research's pre-NestJS pick — Postgres-native, but @nestjs/bullmq integration + Fly's explicit Upstash/BullMQ support won after the NestJS + Fly-native overrides) · pg-boss (same reasoning) · Fly Cron Manager (extra machine per job; repeatable jobs suffice) |
| Redis | **Upstash Redis via Fly extension, `bom`, FIXED plan** (start 250 MB/$10 per month; resize as queues grow) | Fly explicitly recommends fixed plans for BullMQ (PAYG per-request billing is inflated by BullMQ polling). Private IPv6 reachable from all Fly regions incl. `bom` | Self-run Redis on a Machine (one more thing to page on) · PAYG Upstash (cost trap under polling) |
| Config (binding) | `maxRetriesPerRequest: null` · TCP/RESP endpoint (not REST) · **eviction OFF** | BullMQ requires `noeviction`; Upstash eviction mimics `volatile-random`/`allkeys-random` and silently breaks queues. Off is the Upstash default — never enable it | — |
| Heavy CPU | **worker_threads** inside `apps/worker` on dedicated larger Machines, `autostop="off"` | Shading sims at scale and Playwright PDF renders are compute-bound, not queue-bound; scale the worker group independently | Serverless/lambda-style burst (no Fly-native fit; cold Chromium) |

Sources: [./research/verify-flyNative.md](./research/verify-flyNative.md) · [Upstash+BullMQ](https://upstash.com/docs/redis/integrations/bullmq) · [BullMQ production guide](https://docs.bullmq.io/guide/going-to-production) · [Fly Upstash](https://fly.io/docs/upstash/redis/).

## 8. Object storage

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Storage | **Tigris**, **single-region bucket pinned `sin`** (Singapore — nearest; Tigris has no India region). Buckets: survey photos, proposal PDFs, DEM tiles, DB backups | Fly-native (user directive), S3-compatible: SigV4, presigned URLs, multipart verified — serves pgBackRest/Barman targets and the PowerSync Attachments helper; no egress fees | AWS S3 `ap-south-1` (research's residency pick — excluded by the no-AWS directive; documented as the India-region migration path since everything speaks the S3 API) · Cloudflare R2 (no India region either, coarse APAC hint) |

Compliance ruling: DPDP Rules 2025 use a negative-list model — cross-border storage is
permitted by default, so `sin` object storage is compliant while the DB (all primary PII)
stays in `bom`. RBI payment-data localisation is satisfied because Razorpay (an Indian,
RBI-licensed PA) holds payment instruments — we never do. Single-region pin mechanics via
`fly storage create` / `X-Tigris-Regions` are a week-1 spike (CLI flag naming is
under-documented).

Sources: [./research/verify-flyNative.md](./research/verify-flyNative.md) · [./research/fly.md](./research/fly.md) · [Tigris locations](https://www.tigrisdata.com/docs/buckets/locations/) · [DPDP Rule 15](https://www.dpdpa.com/dpdprules/rule15.html).

## 9. Offline sync

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Sync engine | **PowerSync self-hosted (Open Edition)** — `journeyapps/powersync-service` image (pin digest at deploy) on Fly `bom`, **Postgres bucket storage** (no Mongo) | The write path is OUR NestJS connector — idempotent, tenant-checked, versioned; explicit AI-agent-friendly semantics. PowerSync supplies the genuinely hard parts: durable local SQLite + upload queue, Sync Streams parameterised by token (`tenant_id` + assignee), checkpoint consistency, attachment state machine → Tigris presigned uploads | ElectricSQL (read-only sync post-rewrite; no durable offline write queue) · Zero (online-first; stateful zero-cache service; multi-day offline not its sweet spot) · Replicache (maintenance mode) · WatermelonDB (New-Arch untested, you build the whole server side) · RxDB (NoSQL model clash + $99–239/mo Premium) · fully custom queue (rebuilds durability/partial pull/attachments for no gain) |
| Client DBs | **op-sqlite** (mobile, §11) · **@powersync/web** on OPFS (web studio) | One mental model on both surfaces; the design doc syncs as one JSONB row, single-editor LWW + server version check; surveys are versioned-append | Plain optimistic PATCH for web only (works, but splits the mental model) |

Sources: [./research/sync.md](./research/sync.md) · [./research/verify-bareRn.md](./research/verify-bareRn.md) · [PowerSync self-hosting](https://docs.powersync.com/intro/self-hosting) · [Sync Streams](https://docs.powersync.com/sync/overview) · [Attachments helper](https://powersync.com/blog/building-offline-first-file-uploads-with-powersync-attachments-helper).

## 10. Auth

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Auth | **Better Auth 1.6.x** (verified 1.6.24, 22 Jul 2026), self-hosted on our `bom` Postgres, plugins **`organization` + `phoneNumber` + `jwt`** | Phone PII never leaves India (it is a TS library on OUR DB, not a US SaaS); orgs/members/invites + `createAccessControl()` map to the 6 stackable preset roles; `jwt` plugin mints short-lived JWKS-served tokens with `{tenant_id, roles[]}` for Nest guards + RLS `SET LOCAL` backstop | Clerk (US-resident phone PII = DPDP liability; scales to ~$1,025/mo) · WorkOS (enterprise-SSO shape, not phone-OTP-first) · Supabase Auth (couples hosting/regions) · Auth.js v5 (no orgs, no phone OTP, perpetual beta) · custom JWT+OTP (rebuilds orgs/sessions/JWKS for nothing) |
| OTP delivery | **MSG91** (SMS primary ~₹0.15/OTP; WhatsApp-OTP fallback ~₹0.115, same vendor) | Direct Airtel/Jio/VI/BSNL binds, 99%+ delivery <5 s, built-in DLT/TRAI handling; WhatsApp channel sits outside DLT scope for retries | Twilio Verify (~3× cost, self-managed DLT, 92–95% India delivery, data leaves India) · AWS SNS (no-AWS directive + weak OTP tooling) · Exotel OTP (pricier, thinner API than MSG91 — Exotel stays voice-only) |
| Sessions | Web: cookie sessions · **Bare RN: framework-agnostic Better Auth client + custom `getItem`/`setItem` storage adapter over react-native-keychain** | Verified pattern: keychain tolerates Better Auth's colon-separated keys (expo-secure-store rejects them — the custom adapter is actually cleaner). Do NOT install `@better-auth/expo` (pulls Expo deps) | AsyncStorage for tokens (not secure storage) |
| Customer links | Separate **stateless HMAC-signed tokens** (scope + expiry), never touching sessions/RLS-user context | The customer never logs in (product law) | Magic-link accounts (wrong product shape) |

**Critical path: DLT registration (principal entity + headers + templates) takes 1–2 weeks —
file it in week 1 or OTP SMS is blocked at launch.** Better Auth phone-OTP on bare RN is a
week-1 spike (known `sendOtp` rough edges; fallback = call our server OTP endpoint directly).

Sources: [./research/auth.md](./research/auth.md) · [./research/verify-bareRn.md](./research/verify-bareRn.md) · [Better Auth 1.6](https://better-auth.com/blog/1-6) · [phoneNumber plugin](https://better-auth.com/docs/plugins/phone-number) · [keychain-adapter issues #6810/#5426](https://github.com/better-auth/better-auth/issues/6810).

## 11. Web & mobile clients

### Web

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Framework | **Next.js 15.x** (App Router) — `apps/web`, pure frontend/BFF, **no domain logic** | Proven in the POC; route handlers only for cookie/session BFF glue; everything domain-shaped calls `apps/api` through the ts-rest client | Remix/TanStack Start (no advantage worth retraining the corpus) · SPA-only Vite (lose streaming/SSR for the customer link, which must open fast on a stranger's phone) |
| Styling | **Tailwind v4** (4.x), full `@import "tailwindcss"` — fresh repo, no legacy cascade layer | Utilities read from `packages/tokens` CSS variables via `@theme`; the POC's legacy-layer gymnastics die here. **Light-only v1** (owner ruling 2026-07-24) — no dark variants shipped; semantic aliases keep a dark value-set droppable later | CSS-in-JS (runtime cost, token bypass risk) |
| Design tokens | **`packages/tokens` GENERATED from the vendored canonical DS at `design/ds-source/tokens/*.css`** — Style Dictionary parses the CSS as source → emits `tokens.css` (web), `theme.ts` (RN), `tokens.json` (tooling) near-verbatim | The vendored CSS **is** the pixel-perfect spec (canvas `#F6F7F9`, text `#0A0A0B`, accent `#5A4BFF`, e0–e5 elevation, 120/200/320/500ms motion). Extensions applied at generation, clearly marked: Noto Devanagari @font-face, `--brand-wash`, roof/string/irradiance viz namespaces, contrast-pairs metadata. **Never hand-transcribe; `_ds_manifest.json` is untrusted for values** (it snapshotted the 1ms reduced-motion durations as canonical) | Hand-authored DTCG JSON (re-transcription provably drifts — the DS's own manifest did) |
| Fonts | **Geist + Geist Mono** — the two vendored variable woff2 (weight 100–900) at `design/ds-source/assets/fonts/` — plus **Noto Sans Devanagari** for HI/MR | Geist is the DS default sans; Geist Mono carries IDs/kWh/₹/coordinates (564 mono uses across mockups). Geist has no Devanagari glyphs, so the chain is **Geist → Noto Sans Devanagari** (web `next/font`; RN explicit run-splitting) | Inter (unloaded stack fallback only — shipping it repeats the POC's "declared, never shipped" font bug in reverse) · OS Devanagari fallback (Kohinoor/Nirmala — unacceptable for pixel-perfect commercial documents) |
| Components | **`packages/ui` implements the 21-component `_ds` API over Radix primitives** — Button (primary/secondary/ghost/destructive · lg/md/sm), Card, Chip, StatusChip, Input, StatCard, ListRow, EmptyState, OfflineBanner, SegmentedControl, Tabs, Toast, … | The `_ds` prop/variant enums (codified in `_adherence.oxlintrc.json`) are the public API; Radix supplies focus trap/restore + roving tabindex underneath (N5 largely free); the four POC behavioural contracts (NumberField commit-on-blur, DataTable caption, mandatory ariaLabel, focus trap/restore) layer on top | Importing the `_ds` JSX bundle at runtime (it is a spec to implement, not a dependency — mockups consume only `Button`) · shadcn/ui (own token assumptions — fights the vendored DS contract) · MUI/Ant (styled systems, theme fights) · Headless UI (thinner coverage) · React Aria (hooks-first authoring tax for agents) |
| Icons | **Lucide, bundled locally** — outlined, **1.5px stroke**, round caps/joins; 24px default / 20px functional / 28px bottom nav; filled variants only for the active bottom-nav item | DS iconography law; icons in cards/rows sit in the circular 6%-tint container (40px expressive / 32px functional) | Lucide CDN (mockup-only convenience — never in product) · icon fonts / emoji / unicode-as-icon (banned by the DS) |

### Mobile (bare React Native — NO Expo, iOS + Android from day one)

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Framework | **bare React Native**, latest stable 0.8x at scaffold (New Architecture default since 0.76) | **User directive** (no Expo). Field-first app: My Day, leads, quick-add, offline surveys, visits, notifications; the studio opens as an authenticated WebView at full parity (D2: responsive web at 375px) — native canvas editing is NOT rebuilt | Expo (excluded by directive) · Flutter/native (splits the TS domain) |
| Local DB | **@op-engineering/op-sqlite** ≥17 (New-Arch line) | PowerSync's documented native SQLite peer; Fabric/TurboModule support on iOS+Android | react-native-quick-sqlite (superseded by op-sqlite) |
| Metro config (binding) | PowerSync **blockList for inline requires** + **WebSocket transport**; Lingui `@lingui/metro-transformer` with `po`/`pot` in `sourceExts`; async-iterator polyfills as needed | All three are verified bare-RN requirements — skipping any one produces runtime breakage, not build errors | — |
| Push client | **Notifee (@notifee/react-native 9.x) + react-native-firebase** (`@react-native-firebase/app` + `messaging`, current major) | FCM/APNs direct (§18); Notifee owns rich local display/channels; Crashlytics rides the same Firebase dependency | Expo Push (research's original pick — requires Expo, excluded by directive) · OneSignal (third-party data path + cost) |
| Secrets | **react-native-keychain** 10.x | Secure enclave/Keystore-backed; tolerates Better Auth key format (§10) | AsyncStorage (plaintext) |
| Ship | TestFlight + Play internal → stores; store-review lead time on the roadmap critical path; mobile may trail web launch by weeks | — | — |

Sources: [./research/verify-bareRn.md](./research/verify-bareRn.md) · [./research/ds-reconciliation.md](./research/ds-reconciliation.md) (binding resolutions; token census in ds-tokens.md, brand law in ds-brand-law.md, usage in ds-usage.md) · [./research/design.md](./research/design.md) (interaction/a11y contracts only — visuals superseded) · [./research/appShape.md](./research/appShape.md) · [PowerSync RN docs](https://docs.powersync.com/client-sdk-references/react-native-and-expo/react-native-web-support) · [op-sqlite](https://www.npmjs.com/package/@op-engineering/op-sqlite) · [Lingui metro transformer](https://lingui.dev/ref/metro-transformer).

## 12. 3D studio (the flagship — nothing is compromised against it)

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Engine | **three.js** 0.18x (≥r171; POC ships r184 — carry forward) + **@react-three/fiber 9.x** + drei 10.x | POC-proven React-19-compatible stack; the ported `packages/domain` keeps only 4 modules importing three as math | Babylon (retrains the whole ported codebase) · custom WebGL (no) |
| Renderer | **WebGPURenderer** with automatic WebGL2 fallback | WebGPU is baseline across Chrome/Edge/Firefox/Safari in 2026 (~95% coverage); near one-line swap; 2–10× on complex scenes; TSL compute shaders power the GPU shadow-map shading path (288 sun-sample depth maps) — primary shading for the 1 kW→100 MW range | Staying on WebGLRenderer (leaves compute shading + 2–10× on the table for zero benefit given auto-fallback) |
| CPU fallback / near-field | **three-mesh-bvh** 0.9.x (lock at scaffold) | Order-of-magnitude raycast gains for the CPU/worker shading fallback and precise rooftop obstruction raycasts; caveat honoured: centre geometry to dodge float-precision loss at km scale | Scaling per-panel CPU raycast alone (wrong abstraction above ~10k modules — editable unit is block/table/zone, panels are derived instances) |
| Projection | **proj4** 2.x — per-site UTM/ENU origin | The POC's single equirectangular origin breaks at scale; per-site origins are the float-precision fix | Keeping one global origin (known scale cliff) |
| Server sims | Same pure-TS kernels in Node worker_threads (`apps/worker`) | One codebase browser Worker pool ↔ server jobs | Headless-gl three.js on Node (fragile, unmaintained) · Rust/WASM kernel (violates TS-domain rule) |

Sources: [./research/scale3d.md](./research/scale3d.md) · [./research/geo3d.md](./research/geo3d.md) · [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) · [WebGPU baseline 2026](https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default) · [GPU solar shading, Appl. Sci. 2020](https://doi.org/10.3390/app10155361).

## 13. i18n

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| i18n | **Lingui v5** (5.x: `@lingui/core`, `@lingui/react`, `@lingui/metro-transformer`) — one catalog (EN/HI/MR) in `packages/i18n` for Next.js App Router AND bare RN | The only compile-based option covering both surfaces from one catalog; ICU MessageFormat native; verified on bare RN ≥0.73 without Expo; per-user runtime language switch | Paraglide (best type-safety, but no first-class RN support — dealbreaker) · i18next (runtime-heavy; declaration-merging boilerplate agents get wrong) · FormatJS/react-intl (heavier, weaker RN DX) |

Product law travels with the tokens, not the library: ₹ uses Indian grouping (lakh/crore) in
every locale; kW/kWh/kWp are never translated; **Geist → Noto Sans Devanagari** chain (Geist
has no Devanagari glyphs) with explicit RN run-splitting — never OS fallback. Intl polyfills
(`@formatjs/intl-locale`, `@formatjs/intl-pluralrules`) on RN.

Sources: [./research/tooling.md](./research/tooling.md) · [./research/verify-bareRn.md](./research/verify-bareRn.md) · [Lingui RN tutorial](https://lingui.dev/tutorials/react-native).

## 14. Voice agent

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Telephony | **Exotel** (`TelephonyProvider` adapter): Exophones, DLT/TRAI ops, 1600/140x series, **AgentStream bidirectional WS** (<20 ms media), IVR applets, DTMF | Strongest India carrier compliance (UL-VNO licensed); audio/PII stays in India; AgentStream is exactly the seam that keeps STT/LLM/TTS swappable. Per-tenant numbers: platform Exophone default, BYO = hosted/ported with KYC (TRAI CLI rules — never caller-ID spoofing) | Twilio (2–3× cost, thinnest India DLT) · Plivo (less India-native compliance tooling) · Knowlarity/Ozonetel (weaker dev/streaming APIs) |
| Speech + LLM | **Sarvam AI**: Saarika STT / Bulbul TTS / Sarvam LLM | Lowest WER in 13/15 Indian languages (ahead of Gemini 3 Pro); Bulbul beats ElevenLabs on Hindi prosody; sovereign India compute — DPDP-clean; covers HI/MR/GU/TA/TE/EN | Google Chirp/Gemini (close #2, US residency) · ElevenLabs (loses on Hindi, US) · AI4Bharat open models (kept as self-host cost floor, not v1 SLA) |
| Orchestrator | Thin **NestJS `apps/voice`** `CallSession`: turn-taking, barge-in, AI-disclosure ≤30 s, escalate-to-human, outcome classification, outbound **DTMF IVR traversal** (`sendDtmf`/`onDtmf`) | Owning the thin glue keeps every vendor swappable; every call ledgered per tenant with cost breakdown (≈₹2.5–4/min outbound all-in) | Vapi/Retell/Bland (US audio transit fails DPDP; ₹3+/min + fees) · Sarvam Samvaad (managed runtime weakens the swap boundary) · Pipecat (Python breaks TS-everywhere) |
| Plan B | **Bolna** (~₹6/min India-native all-in-one) behind the SAME ports | Documented single-vendor shortcut if orchestration slips; config swap, not rewrite | LiveKit self-host = v2 at volume, the reference target the ports are designed for |

**`ComplianceGate` is ours and non-swappable**: daily DND scrub, consent, 9am–9pm window +
holiday calendar, 1600/140x routing, keypress opt-out ≤24 h, 90-day recording retention.
Penalty (₹25,000/upheld complaint) lands on the tenant — so we gate it in our code.

Sources: [./research/voice.md](./research/voice.md) · [Exotel AgentStream](https://docs.exotel.com/exotel-agentstream/bidirectional-streaming) · [Sarvam pricing](https://www.sarvam.ai/api-pricing) · [Indic ASR benchmarks](https://huggingface.co/datasets/ai4bharat/SpeechArenaBench).

## 15. Billing (IN v1 — D38 superseded by product owner, 2026-07-24)

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Subscriptions | **Razorpay Subscriptions** (razorpay Node SDK 2.x): UPI AutoPay primary (₹15k/debit cap fits tier prices), card e-mandate fallback; **native trial support** → trial-only, no free tier; Razorpay handles pre-debit notifications | One India-licensed PA (PA-Online + Cross-Border + Physical) covering mandates, trials and invoices; cheapest recurring rail (UPI AutoPay ~0.5%+GST vs cards ~2%+0.99%+GST) | Stripe (still not a general domestic India acquirer in 2026) · Chargebee ($7,188/yr Performance tier, sits on top of Razorpay anyway) · Zoho Billing (weak usage-based billing) |
| Invoicing | **Razorpay Invoices** — GST-compliant invoice per cycle (our GSTIN/SAC); we are supplier of record; e-invoicing IRN validation is ours; Razorpay's 18% GST on fees tracked separately | Native pairing with Subscriptions; no second billing system | Separate invoicing SaaS (second source of truth) |
| Webhooks (binding) | HMAC verify → dedupe on `x-razorpay-event-id` → fast-2xx → queue; `subscription.charged` grants entitlement; API-polling reconciliation backstop | Razorpay delivery is at-least-once with reordering — these patterns are mandatory, not optional | Trusting webhook ordering (guaranteed incident) |
| Entitlements | **In-house on Postgres**: `plans`, `subscriptions`, `subscription_events`, `entitlements`, append-only `usage_events` (voice minutes, AI detections, OTP, storage) with period rollups; soft-block UX; **read + export always work regardless of billing state** | A few days' work, one source of truth, maps cleanly to webhooks; the ONLY runtime gating in the product (no feature flags) | Chargebee/Zoho as entitlement layer (verified rejection for a next-month launch) |
| Tenant collections | **BYO-Razorpay payment links per tenant** (`PaymentLinkPort`) — funds flow customer → EPC's own account; platform never touches money → no RBI PA licence | Keeps us out of PA regulation entirely | Razorpay Route (alternate adapter only — makes us master merchant with KYC burden) |

Sources: [./research/verify-billing.md](./research/verify-billing.md) · [./research/integrations.md](./research/integrations.md) · [Razorpay subscriptions webhooks](https://razorpay.com/docs/webhooks/subscriptions/) · [UPI AutoPay guide](https://razorpay.com/blog/master-recurring-payments-upi-autopay-guide/).

## 16. PDF rendering

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| PDF | **Playwright 1.x headless Chromium** in `apps/worker` (`DocumentRenderPort`); Noto Sans Devanagari bundled in the Fly image (`fonts-noto`); 300–500 MB RAM budget/instance, pooled processes | Chromium's HarfBuzz is the only path that shapes Devanagari correctly — proposals in Hindi/Marathi are commercial documents, broken conjuncts are not acceptable; HTML/CSS templates reuse web skills | react-pdf (fontkit does not fully shape Devanagari — long-standing broken conjuncts/matras, issues #454/#856 — disqualified) · Typst (genuine Indic shaping, far lighter — documented swap behind the port if Chromium RAM bites, but a new template language for agents now) |

Sources: [./research/integrations.md](./research/integrations.md) · [react-pdf #454](https://github.com/diegomura/react-pdf/issues/454) · [State of Text Rendering](https://behdad.org/text2024/).

## 17. Push notifications

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Push | **FCM + APNs direct** via `PushPort` in `apps/api`; client = Notifee + react-native-firebase (§11) | Bare-RN directive removes the Expo Push wrapper; direct FCM/APNs gives delivery receipts and data-only messages with zero third-party data path | Expo Push (research's pick pre-directive — Expo-only) · OneSignal/Courier (extra vendor, extra data path, no need) |

Sources: [./research/integrations.md](./research/integrations.md) · [./research/verify-bareRn.md](./research/verify-bareRn.md).

## 18. Observability

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| Logging | **pino 9.x** via nestjs-pino (api/worker/voice) — structured JSON, redaction paths for phone numbers/tokens | Fastest Node structured logger; Nest-idiomatic; redaction is DPDP hygiene (no PII in logs) | winston (slower, unstructured drift) |
| Traces/metrics | **OpenTelemetry** (`@opentelemetry/sdk-node` + auto-instrumentations, OTLP export) | Vendor-neutral pipes; instruments Nest/HTTP/Drizzle-pg/BullMQ out of the box | Vendor SDKs (lock-in for nothing) |
| Backend | **Grafana Cloud** (decisive pick — not self-host): OTLP-native endpoint; Fly's Prometheus metrics remote-written in; alert rules carry the MANDATORY DB alerts (disk/replication lag/OOM) from §6 | Launch is next month with zero ops headcount — running an LGTM stack on Fly is exactly the "unnecessary complexity" the directives forbid; generous free tier, pay as telemetry grows. Telemetry is not customer PII (redaction enforced), so US/EU-region Grafana is DPDP-fine | Self-hosted LGTM on Fly (ops burden now, revisit at scale) · Datadog (cost curve) · Sentry-only (no metrics/alerting story) |
| Mobile crashes | **Firebase Crashlytics** (rides the react-native-firebase dependency already in the app) | Zero new vendors for RN crash triage | Sentry RN (fine tool, second vendor for the same job) |

Sources: [./research/fly.md](./research/fly.md) (Fly metrics/topology context) · [Fly autostop/processes](https://fly.io/docs/launch/autostop-autostart/).

## 19. CI/CD

| Component | Choice & pin | Why | Rejected (reason) |
|---|---|---|---|
| CI | **GitHub Actions**: `quality` lane on ubuntu-24.04 — `pnpm turbo lint` (Biome + dependency-cruiser + sherif) → `typecheck` → `test` (ported domain tests + locked invariants only) → `build`, with Turborepo remote cache | Repo lives on GitHub; Turborepo cache is free/self-hostable (no Nx Cloud credit metering); one YAML surface agents can read and edit | CircleCI/Buildkite (second vendor, no gain) · self-hosted runners (a cost optimisation for later, not launch) |
| Deploy | `flyctl deploy` per app (api, worker, voice, powersync, web) from main — no feature flags, so trunk stays releasable by discipline: small complete slices only | Matches the no-flags directive; incomplete work simply doesn't merge | Preview-env sprawl (not needed at this team size) |
| Android lane | ubuntu-24.04 + JDK 17 + Gradle → Play internal track | Standard bare-RN pipeline | Bitrise (second CI for one lane) |
| **iOS lane** | **macos-15 runner + Xcode 16.x**: pod install → `xcodebuild archive` → fastlane pilot → TestFlight | Bare RN (no Expo) means we own signing and archives — **EAS Build is unavailable by directive**, so the macOS lane is mandatory, not optional; macOS runner minutes are the priced-in cost of the no-Expo choice | EAS Build (Expo — excluded) · Xcode Cloud (splits CI across two systems) |

Sources: [./research/tooling.md](./research/tooling.md) · [./research/verify-bareRn.md](./research/verify-bareRn.md).

---

## Week-1 verification spikes (from BLUEPRINT — run before the stack is considered locked)

1. **Better Auth phone-OTP on bare RN** — framework-agnostic client + react-native-keychain
   storage adapter end-to-end (known `sendOtp` rough edges; fallback = direct server OTP endpoint).
2. **pgBackRest → Tigris archive + restore drill** — prove the WAL-archive layer AND a full
   restore on postgres-flex before launch (no doc certifies pgBackRest against Tigris; treat
   as "S3-compatible, expected to work" until we have restored from it).
3. **ts-rest 3.53 / Zod-4 status check** — if 3.53 has left RC, decide the Zod-4 migration
   window; until then the Zod 3.25.x pin stands.
4. **Tigris single-region pin via `fly storage create`** — confirm the CLI/console path to a
   `sin`-pinned bucket (flag naming under-documented).
5. **Exotel BYO-number porting mechanics + AgentStream DTMF** — exact hosted/ported-number
   flow with KYC under TRAI CLI rules, and DTMF send/detect over AgentStream for outbound
   IVR traversal.

Plus the standing critical-path item: **file DLT registration (entity + headers + templates)
in week 1** — 1–2 weeks approval lead time gates OTP SMS and voice-agent launch.
