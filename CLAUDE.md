# HelioGrid — Agent Constitution

Multi-tenant SaaS for Indian solar EPC companies: CRM → survey → 3D design → proposal →
customer link → voice-agent follow-up → projects → payments. India-first, global-ready.
**The 3D Design Studio is the flagship. Nothing is compromised against it.**

> **Current repo state: PLANNING.** Only `docs/` and agent rules exist. Application code
> starts with the roadmap in `docs/14-build-roadmap.md`. Until scaffolding lands, the
> Commands section below is the contract for how it WILL work — do not invent other flows.

## Read order (before writing any code)

1. `docs/BLUEPRINT.md` — the approved architecture. Binding. Conflicts resolve here first.
2. `docs/02-system-architecture.md` + `docs/03-tech-stack.md` — how it all fits, version pins.
3. `docs/04-data-model.md` — schema. Never invent a table/column that isn't here or in a migration.
4. The doc for your area (`docs/05`–`docs/16`) + the rule file for your layer (`.claude/rules/`).
5. The POC spec is law for product behavior: `/Volumes/works-space/Solar-App-POC/docs/product-journey.md`
   (decisions D1–D39; D38 superseded — billing IS in v1) and `docs/15-spec-resolutions.md` for rulings.

## Commands (the only verification that counts)

```bash
pnpm install                 # workspace install
pnpm turbo typecheck         # tsc -b, all packages — must be green
pnpm turbo lint              # biome check + dependency-cruiser + sherif — must be green
pnpm turbo test              # ported domain tests + locked invariants ONLY (see Testing)
pnpm turbo build             # all apps
pnpm --filter @heliogrid/db migrate   # apply migrations (never edit an applied migration)
```

A task is DONE only when typecheck + lint + test are green AND the change is verified
running (browser for web, simulator/device for mobile, curl/logs for api/worker).
Never claim done on green gates alone for UI work — open it and look.

## The stack (do not substitute)

NestJS (api, worker, voice — Node 22, modular monolith) · Next.js (web, frontend only —
NO domain logic in web) · bare React Native, NO Expo (mobile) · ts-rest + Zod 3.x
(contracts) · Drizzle + Postgres (Fly postgres-flex bom) · BullMQ + Upstash Redis (jobs)
· PowerSync self-hosted (offline sync) · Better Auth + MSG91 OTP (auth) · Tigris (objects)
· Lingui v5 (i18n EN/HI/MR) · Exotel + Sarvam (voice) · Razorpay (billing v1) ·
three.js/R3F + WebGPU (studio). Rationale + pins: `docs/03-tech-stack.md` and `docs/adr/`.

## Hard rules (violating any one = the change is wrong)

**Architecture**
- `packages/domain` is pure TS: no NestJS, no React, no fetch, no storage, no env reads.
  Rules/catalogs/market config are INJECTED parameters — never module-level globals.
- Dependency direction: `apps/* → packages/contracts → packages/domain`. `domain` imports
  nothing from `db`/`api`/`ui`. dependency-cruiser enforces this; do not weaken its config.
- Contract-first: change `packages/contracts` (ts-rest + Zod) BEFORE implementing an
  endpoint or client. The contract diff IS the API review surface.
- Every DB row that belongs to a tenant has `tenant_id`. Every query path goes through
  the tenant-scoped repository layer. RLS is the backstop, not the primary — both exist.
- No feature flags. Features ship enabled when merged; incomplete work doesn't merge.
  The only runtime gating is billing entitlements.
- Server assigns all business identifiers (proposal numbers, project numbers). Never client-generated.

**Money & honesty (product law, from the POC — port, don't reinvent)**
- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed.
- Money never renders while stale: design changed + quote not recomputed → figure reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ project payments must reconcile to the paisa.
- Sent proposals keep their original prices; price-book updates create new versions.
- Structural adequacy is NEVER computed — engineer sign-off recorded (who + when). The
  disclaimer travels with every structure-bearing output.
- ₹ uses Indian grouping (lakh/crore) in every locale. kW/kWh/kWp are never translated.
- Read + export always work regardless of billing state. Never hold data hostage.

**Files & process**
- Use Edit/Write tools for ALL file changes. Never sed/perl/python -i — it has corrupted
  files in the predecessor repo.
- Never edit an applied migration; add a new one. Migrations are append-only history.
- Max file ~450 lines — split before you hit it. One module = one responsibility.
- Match surrounding code style. Comments only for constraints code can't express.
- Never commit secrets. Fly secrets / .env.local only; .env.example documents every var.

**UI (see .claude/rules/ui.md + docs/10 for the full contract)**
- No raw values: no hex, no arbitrary px, no inline style. Everything from `packages/tokens`,
  which is GENERATED from `design/ds-source` — missing tokens are extended at generation,
  clearly marked; never hand-transcribed, never inlined.
- Primary actions are NEAR-BLACK (`#0A0A0B`, hover `#26262A`, pressed `#000000`), never
  coloured. Accent `#5A4BFF` = focus/links/selected/active-tab/control fills ONLY — never a
  button fill. Iridescence is atmosphere, never information. Hierarchy from luminance +
  elevation — no structural 1px borders (hairline `rgba(10,10,11,0.06)` only).
- LIGHT-ONLY v1: dark is struck from the DoD (alias layer kept for a later dark set). The
  11px/700/uppercase/0.12em overline is the ONE sub-12px exception — micro-labels only.
- The POC's DESIGN-SYSTEM.md is interaction/a11y contracts only — ALL visuals come from
  `design/ds-source` (see docs/10). "Instrument" graphite+brass is retired.
- Touch targets ≥44px; no hover-only meaning; 375px works for EVERY screen incl. studio;
  loading/empty/error/offline states are part of done.

## Testing (deliberately thin — do not expand it)

Product decision: no routine unit-test authoring until the post-release testing program.
What DOES exist and must stay green:
1. Ported POC domain tests in `packages/domain` (one-frame gate, geometry, electrical,
   BOM golden files) — they travel with the ported code, never delete or skip them.
2. The locked invariant set (`tests/invariants/`): money math (GST/discount/subsidy/tranches
   sum), tenant isolation (cross-tenant read/write must fail), migration round-trips.
3. Nothing else. Do not add tests beyond these without an explicit user request.

## Working style

- Plan → contract → schema → implement → verify in the running app. In that order.
- Small complete slices; wire every new screen into the flows that reach it (never orphan
  a screen — backward-wire into existing actions).
- When a doc and code disagree, STOP and reconcile the doc first (or flag it) — docs here
  are load-bearing for other agents.
- Irreversible/architectural choices get an ADR in `docs/adr/` before implementation.
- Forward-compatibility register (`docs/14-build-roadmap.md`): before building module X,
  read what Y and Z will need from it. No missing foreign keys three modules later.
- Restart the dev server before believing a blank screen (stale HMR lies).

## Per-package rules

Each package/app gets its own `CLAUDE.md` at creation (template in
`.claude/rules/module-template.md`). Layer rules live in `.claude/rules/`:
`domain.md` · `api.md` · `db.md` · `ui.md` · `mobile.md` · `i18n.md` · `testing-lite.md`.
