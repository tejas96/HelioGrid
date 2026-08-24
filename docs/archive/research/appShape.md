> **HISTORICAL EVIDENCE** — its conclusions are already promoted into the authority named below. Cite that, not this file. Promoted into docs/03 (stack snapshot) and docs/06 §quarantine.

I now have a complete picture of the application shell. Here is the map.

---

# HelioGrid / Solar-App-POC — Application Shell Map

Product context (from `CLAUDE.md`): "Solar EPC SaaS for the Indian market. Residential rooftop **and** C&I." v1 scope is **Sell**: CRM → survey → design → quote → proposal → close. Currently a single-tenant, client-side-only POC ("not in production yet", "Push to `main` directly").

## 1. TECH STACK TODAY

**Framework / runtime**
- `next` **^15.3.5** (App Router; `next dev`/`next build`/`next start`; no custom server)
- `react` / `react-dom` **^19.2.6** (React 19, automatic JSX runtime)
- `typescript` **^5.8.3**, strict mode, `moduleResolution: bundler`, path alias `@/* → ./src/*`
- `next.config.ts`: `transpilePackages: ['three']`; `watchOptions.pollIntervalMs: 1000` (because the repo lives on a `/Volumes` mount without fsevents)

**3D / graphics**
- `three` **^0.184.0** (+ `@types/three`)
- `@react-three/fiber` **^9.6.1** (R3F, React-19-compatible major)
- `@react-three/drei` **^10.7.7**

**State / styling**
- **No Redux/Zustand.** State is a hand-rolled `useReducer` + React Context store (`store.tsx`) — this is worth noting since the task hint mentioned zustand; it is NOT used.
- `tailwindcss` **^4.3.3** (Tailwind v4, `@tailwindcss/postcss`, `@theme` tokens). Preflight is deliberately NOT imported; only `theme.css` + `utilities.css` are pulled in so legacy Solar Studio CSS survives. Cascade-layer order `legacy, theme, base, components, utilities`.

**Data / geo / misc**
- `geotiff` **^3.0.5** (parses Google Solar DSM/RGB/mask rasters client-side)
- `polygon-clipping` **^0.15.7** (roof/panel geometry booleans)
- `qrcode` **^1.5.4** (+ `@types/qrcode`) — share-link QR in the proposal
- `lucide-react` **^0.525.0** (all icons)
- `@types/google.maps` (Maps JS typings — client Maps loader)

**Testing / tooling**
- `vitest` **^3.2.4** (`test: vitest run`), Node environment by default; component tests opt into jsdom per-file via `// @vitest-environment jsdom`. `esbuild.jsx: 'automatic'`.
- `@testing-library/react` **^16.3.2**, `@testing-library/user-event`, `jsdom` **^29**, `axe-core` **^4.12.1** (a11y), `fake-indexeddb` **^6.2.5** (persistence tests)
- Lint via `next lint`. No Prettier/ESLint config surfaced at root.

## 2. ROUTE MAP

App Router with a single route group `(studio)` that carries the client shell, plus a standalone `/design` page and the `/api` tree.

| Route | File | Renders | Notes |
|---|---|---|---|
| `/` | `(studio)/page.tsx` | — | Client redirect: `router.replace(user ? '/projects' : '/login')` |
| `/login` | `(studio)/login/page.tsx` | `screens/Login` | **Fake** two-step phone→password login (see §6) |
| `/projects` | `(studio)/projects/page.tsx` | `screens/Dashboard` | Project list / CRM home |
| `/wizard/[step]` | `(studio)/wizard/[step]/page.tsx` | `screens/Wizard` | Step clamped to 1–10; the 10-step design flow |
| `/proposal` | `(studio)/proposal/page.tsx` | `screens/ProposalView` | Printable proposal (Print→PDF), embeds share QR |
| `/share/[shareId]` | `(studio)/share/[shareId]/page.tsx` | `screens/ShareViewer` | **Public** read-only 3D viewer — the QR/share-link target |
| `/design` | `app/design/page.tsx` | inline | Design-system reference (tokens, swatches); has its own metadata, outside `(studio)` group |

**Shell wiring**
- Root `app/layout.tsx`: sets `<html lang="en">`, imports the single stylesheet `@/design/index.css`, metadata `title: 'Solar App'`.
- `(studio)/layout.tsx`: `export const dynamic = 'force-dynamic'`; delegates to `StudioClientLayout`.
- `(studio)/StudioClientLayout.tsx` is the real shell: wraps children in `StoreProvider`, runs background `DesignSync` (`useDesignSync` + `useHealthSync` recompute hosts), renders a `PersistStatusChip` ("Not saved" quota alert), an `ExternalConflictBanner` (multi-tab last-writer-wins), and `RouteGuards`.
- **RouteGuards** (client-side, in `StudioClientLayout`): after hydration — `share` route is always public; if no `user` and not on `login` → `/login`; if `user` on `login` → `/projects`; `wizard`/`proposal` with no active project → `/projects`. Renders nothing until `state.hydrated` (localStorage load) to avoid SSR/client mismatch.
- **Router adapter** `features/solar-studio/router.ts`: thin wrapper over `next/navigation` exposing an imperative `navigate()` and a `useRoute()` that reparses `usePathname()` into `{name, step, shareId}`. `Route.name` union includes a `'bom'` case and the router maps `/bom`, but **there is no `/bom` page route** (dead/legacy path — BOM lives as wizard step 9).

**Public/anonymous surface:** only `/share/[shareId]`. It reads the project purely from the local store (`state.projects.find(p => p.shareId === shareId)`), so a share link only resolves **on the device that created it** ("the design isn't on this device (POC stores locally)"). This is the single most important thing the SaaS must make server-backed.

## 3. API PROXIES (`src/app/api/*`)

All are `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, `cache: 'no-store'` upstream, with bounded `AbortController` timeouts, and (except the geotiff relay) a uniform **always-HTTP-200 status envelope** `{ status: 'ok'|'unavailable'|'error', ... }`.

| Route | Proxies | Env / keys | Timeout | Notes |
|---|---|---|---|---|
| `GET /api/pvgis?lat&lng` | EU JRC **PVGIS** `v5_3/MRcalc` (horizontal irradiance) | none | 8 s | Sole irradiance/energy source. DB ladder SARAH3→ERA5 (`PVGIS_DB_LADDER`); 400 = outside coverage → `unavailable`. Caches ok result 24 h. |
| `GET /api/solar/building-insights?lat&lng` | **Google Solar** `buildingInsights:findClosest` (`requiredQuality=BASE`) | `serverSolarKey()` | 8 s | Maps via `lib/solarApi.mapBuildingInsights`. 404 → `unavailable`; cache 24 h. |
| `GET /api/solar/data-layers?lat&lng&radius` | **Google Solar** `dataLayers:get` (`view=IMAGERY_LAYERS`, `requiredQuality=LOW`, radius clamp 10–100 m) | `serverSolarKey()` | 8 s | Requests **geometry layers only** (DSM+RGB+mask); flux layers never fetched. Rewrites the 1-hour-signed raster URLs to the `/api/solar/geotiff` relay so the key never reaches the client. |
| `GET /api/solar/geotiff?src=` | **Google Solar** `geoTiff:get` raster bytes | `serverSolarKey()` | 20 s | SSRF-guarded: `src` must start with `https://solar.googleapis.com/v1/geoTiff:get`. Streams `image/tiff`. 404→410 (expired), else 502. Only route that returns raw bytes, not the JSON envelope. |
| `POST /api/gemini` | **Google Gemini** `generativeLanguage v1beta …:generateContent` | `GEMINI_API_KEY` (+ `GEMINI_MODEL`, default `gemini-2.5-flash`; uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to server-fetch the satellite tile) | 25 s | AI rooftop detection from imagery. `temperature 0`, enforced `responseSchema` (structured JSON polygons/objects), versioned prompt `roof-detect-v1`, ≤4 MB image. Missing key → `{status:'unconfigured'}` (graceful degrade). In satellite mode fetches the exact z20/640px static tile so pixel mapping matches `SatCanvas`. |

**Key resolution** (`src/app/api/solar/key.ts`): `serverSolarKey() = GOOGLE_SOLAR_API_KEY ?? NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Dev fallback to the public Maps key; production is meant to split keys.

**Env vars (only four exist; per `.env.example` + `.env`, `.env.local` present locally):**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — **client bundle**, Maps JS loader + Static tiles (used by `lib/maps`, `SatCanvas`, Dashboard thumbnails).
- `GOOGLE_SOLAR_API_KEY` — server-only, paid Solar endpoints.
- `GEMINI_API_KEY` (+ optional `GEMINI_MODEL`) — server-only, optional AI detection.

There is **no** database URL, auth secret, payment key, storage bucket, or tenant/env var of any kind — nothing server-stateful exists.

## 4. SCREEN INVENTORY (`src/features/solar-studio/screens/`)

Screens are the shell-level surfaces; `src/app` pages are thin re-exports of these. Sizes are file bytes (rough complexity proxy).

| Screen | Size | One-line purpose |
|---|---|---|
| `Login.tsx` | 6.0 KB | Mock phone(+91)/password login; any password works; dispatches a fake `AppUser`. |
| `Dashboard.tsx` | 20 KB | CRM/project home: list, search, filter (all/in_progress/proposal_ready), sort, create/duplicate/delete, satellite thumbnails, language picker (only `en` selectable), logout. |
| `Wizard.tsx` | 20 KB | 10-step wizard chrome: header (step name, Design-Health chip, unit toggle, save/home/help, Next/Back), progress bar, per-step `nextBlocker` gates + `electricalGate` hard gate, `allowedStep` deep-link guard, Help/Health sheets. |
| `Step1Setup.tsx` | 26 KB | Project setup: name, customer, site type (residential/C&I), DISCOM/state → tariff, map pin (drives weather), logo upload. |
| `Step2Roof.tsx` | **120 KB** | CAD-style roof tracing: polygon draw, vertex/edge edit, height/pitch/parapet, gable/hip conversion, measure/calibrate, Solar/Gemini import. (Largest screen.) |
| `Step3Obstructions.tsx` | 38 KB | Mark rooftop obstructions (tanks, chimneys, dishes, etc.) with real heights → shadow casting; keepout vs bridgeable. |
| `Step4Components.tsx` | 35 KB | Choose panel + inverter from `PANEL_DB`; target kWp; comparison matrix running full energy/money pipeline per candidate; DCR/MPPT logic. |
| `Step6Editor.tsx` | **129 KB** | Manual panel-layout editor: tools (place/erase/walkway/keepout/rail/arrester/inverter/stringing/heatmap), selection, nudge, setback/obstruction refusal, stringing, safety, **freemium plan-limit banner**. (Largest file in repo.) Steps 5 (auto-placement) and 6 both mount this. |
| `Step7Proposal.tsx` | 15 KB | Capture shadow-study / solar-access imagery and cover photo for the proposal; captures fingerprinted to design (flagged stale on edits). |
| `Step8Sld.tsx` | 40 KB | Single-line diagram + drawing set; ratings derived from components with resettable overrides; export DXF/PNG/SVG; structure sheet + disclaimer. |
| `Step9Bom/` (folder) | ~47 KB | BOM & pricing: `index.tsx` (17 KB) + `BomRow`, `BomSection`, `SectionInputs`, `DiscountField`, `OrphanBanner`, `StaleBanner`. Line-item formulas, overrides w/ divergence badges, margin/discount — "the ONLY margin". |
| `Step10Done.tsx` | 3.0 KB | Completion: marks `status='proposal_ready'`, builds `shareUrl = ${location.origin}/share/${shareId}`, links to proposal/installation sheet. |
| `ProposalView.tsx` | 27 KB | Full printable customer proposal (Print→Save-as-PDF): energy, financials, financing (4 options), BOM money, embedded scannable share **QR** (`qrcode`, inline SVG). |
| `ShareViewer.tsx` | 1.5 KB | Public read-only R3F 3D viewer keyed by `shareId`; resolves project from local store only. |
| `InstallationSheet.tsx` | 6.3 KB | Read-only installer work order derived from `lib/installation`; crew checkboxes keyed by structural step id. |
| `step6-erase.ts` | 2.7 KB | Helper module (erase-tool logic) for Step6. |
| `__tests__/` | — | Screen-level tests. |

Supporting shell dirs (high-level, not solar-studio internals): `components/` — shared UI primitives `ui.tsx` (Sheet, Dialog, Seg, UnitToggle, EmptyState…), `BlobImg` (renders IndexedDB blobs), `SatCanvas` (Maps static-tile canvas), `MeasureTool`, `EdgeLabels`, `StructurePreview`, `EnergyReportSheet`, and `drawing/` (`StructureSheet`, `TitleBlock`/`Sheet` for SLD/DXF output). `three/` — R3F scene: `Scene3D`, `PanelsInstanced`, `StructureInstanced`, `ObstructionMesh`, `HeatmapLayer`, `LegPlanEditor`, `StructEditPanel`, `textures.ts`, `profile-geometry.ts`.

## 5. FREEMIUM / BILLING LEFTOVERS

There is a **single vestigial freemium gate** — no real billing engine, no Stripe/Razorpay, no subscription/entitlement model, no plans table.

- `data/rules/india.ts`: `planLimitKw: 10` with comment `/** freemium plan gate on total DC capacity (kW) */` (line 118 type, line 529 value).
- `screens/Step6Editor.tsx:140`: `const PLAN_LIMIT_KW = resolveRules().defaults.planLimitKw; // freemium capacity gate`.
  - `:363` `const overLimit = kwp > PLAN_LIMIT_KW;`
  - `:1115` banner: "Total capacity {kwp} kWp exceeds the {10} kW plan limit — remove panels or upgrade."
  - `:1121` the **Upgrade** button is a stub: `onClick={() => flash('info', 'Plan upgrades are not available in this demo')}`.

So: a hard-coded 10 kW cap surfaced in the editor with a dead "Upgrade" CTA. Everything a real freemium tier needs — plan definitions, per-tenant entitlements, metering, checkout, enforcement server-side — is absent and must be built.

## 6. WHAT'S FAKE (must become real for multi-tenant SaaS)

**Auth — entirely fake.** `Login.tsx` header comment: "Mock two-step phone login … any password works." Validates only a 10-digit phone regex, then `dispatch({type:'login', user:{phone, companyName:'helio grid', language:'en', units:'metric'}})`. No OTP, no password check, no token/session, no server call. "Forgot password?" is a no-op button. Route protection is purely client-side (`RouteGuards`, `Wizard.allowedStep`) — trivially bypassable; there is no server auth on any `/api` route.

**Tenancy — nonexistent.** No org/tenant/user IDs anywhere. `AppUser` is `{phone, companyName, language, units}` — `companyName` is hard-coded `'helio grid'`. All projects live in one flat local list; no ownership, no isolation, no RBAC. The whole multi-tenant layer is greenfield.

**Persistence — 100% browser-local.** `lib/persistence/repository.ts` + `store.tsx`: projects in **localStorage** (schema v2: `META_KEY` index + per-project `prj:` keys), images in **IndexedDB** (`blobs.ts`), debounced dirty-key writes, quota surfaced as the "Not saved" chip, v1→v2 migration, per-project quarantine on corrupt payloads, and cross-tab reconciliation via the `storage` event with **last-writer-wins** merge. There is no backend DB, no sync, no server API for reading/writing projects. Nothing persists across devices or browsers.

**Sharing — local-only, not truly public.** `shareId` is a client-generated `crypto.randomUUID().slice(0,12)`. `/share/[shareId]` and the proposal QR build `${location.origin}/share/${shareId}`, but `ShareViewer` resolves the project from the **local store**, so the link works only on the originating device ("the design isn't on this device (POC stores locally)"). A real SaaS needs server-stored, tenant-scoped, publicly resolvable share documents.

**i18n — advertised, not built.** Dashboard language picker shows Hindi/Thai/Vietnamese but only English is selectable/translated ("a picker that stores a language nothing renders in is a control that lies"). Multi-market SaaS will need real i18n.

**External data — real but unauthenticated proxies.** PVGIS/Google Solar/Gemini calls are genuine, but the `/api` routes have no auth, no per-tenant rate limiting, no usage metering/quotas, and a dev key-fallback that leaks the paid Solar key onto the public Maps key. These become cost/abuse vectors under multi-tenancy.

**Other mocked/dead controls to note:** the `'bom'` route name is wired in `router.ts` with no page; "Upgrade" is a demo toast; "Forgot password?" is inert; `dynamic='force-dynamic'` on the studio layout plus client-only hydration means there is effectively no SSR of app content.

**Net for the rebuild:** the entire back half of a SaaS is missing — identity/auth + sessions, multi-tenant org model + RBAC, a real database and server persistence API (replacing localStorage/IndexedDB), server-side share documents, billing/entitlements (replacing the 10 kW stub), authenticated + metered external-API proxies, and i18n. The front half — the 10-step design/quote/proposal engine, 3D scene, geometry/energy/electrical/BOM logic, design system, and Google Solar/PVGIS/Gemini integrations — is substantial and real, and is the asset to preserve.