# HelioGrid architecture — the spine

The single canonical home for inter-package facts: what each package owns, what it may
depend on, its platform scope, and where new code goes. Other documents POINT here; none
restates it (spec: docs/superpowers/specs/2026-08-02-governance-rebuild-design.md §3).
This file states POLICY. The current dependency graph lives in package.json files;
enforcement lives in .dependency-cruiser.cjs (authoritative) and turbo boundaries tags
(coarse cover). Anything describing unbuilt design carries a STATUS banner.

## §1 Module map & dependency direction

Layers, top to bottom — imports point strictly downward:

    apps (web · mobile · api · worker)  +  tests/invariants
      ↓
    feature-facing packages: data · forms · i18n · ui · ui-api
      ↓
    foundation packages: contracts · domain · tokens · db · env
      ↓
    config

- Packages NEVER import apps. Lower layers never import higher ones.
- The only wire path for frontend apps is @heliogrid/data (ADR-0023) — the sole
  initClient call in the repo lives there.
- db is backend-only, except the @heliogrid/db/uuid subpath (app-side id generation).
- dependency-cruiser is the authoritative boundary enforcer; turbo tags are redundant
  coarse cover (they cannot express data↛ui-api or web↛db — dep-cruiser holds those).

## §2 Package registry

<!-- One block per package/app — Tasks 11 and 12. Block shape:
     purpose · owns · allowed deps (policy) · forbidden (the notable ones) ·
     platform scope · belongs here / never here · extension points -->

## §3 Platform rules — React Native · Next.js · shared

### React Native (apps/mobile)
- UI composes from apps/mobile/src/ui ONLY — the RN half of the design system,
  parity-locked to @heliogrid/ui-api. Interactive RN primitives (Text, Pressable,
  TextInput…) are lint-banned in screens; layout primitives (View, ScrollView) allowed.
- No web-only dependencies, no DOM APIs. No expo, no EAS, no AsyncStorage (owner rulings;
  see apps/mobile/CLAUDE.md landmines for the dated reasons).
- Platform APIs (camera, storage, notifications, keychain) stay isolated in dedicated
  modules under apps/mobile/src/ (today: push/; adapter packages land with their modules).
- Navigation is React Navigation static config; navigation state derives from shared
  session/domain state, never duplicated into screens.
- Metro is the bundler: RN debug builds serve JS lazily — a screen "running" on a
  loading view proves nothing (QA lore, measured property of Metro).

### Next.js (apps/web)
- UI composes from @heliogrid/ui ONLY (raw elements lint-banned across app/ and
  features/). app/ routes; features/ own capability; page.tsx never holds logic.
- Server/Client boundary: product screens are client components ("use client" at the
  screen/feature level, not sprinkled per-widget); server components are the default only
  for pure-render routes (today: /design). DOM-only APIs (window, navigator) live in
  hooks under features/*/shared/, never in shared packages, never at module top level
  (SSR executes it).
- No React Native imports of any kind. Web-specific optimization (SSR/RSC/caching)
  never leaks into shared packages.

### Shared (packages/*)
- Platform-agnostic by law (Law 10): no DOM, no react-native, no Node-only APIs outside
  declared server entries (env/server, db, data's client is isomorphic-fetch).
- Business logic, policy numbers, protocol constants → domain. Flow view-models shared by
  both platforms → authored once in domain/data BEFORE either screen consumes them
  (Law 11). Copy both platforms need → packages/i18n/src/copy. Visual values → tokens.
  Wire shapes → contracts. Form state → forms.
- Platform-specific implementations are injected via app-side modules (adapter packages
  land per-module; the fences for them already exist in dep-cruiser and turbo tags —
  deliberate pre-landing, per admin-pool-fenced's pattern).

## §4 Placement procedure — run BEFORE writing any new file

Walk top-down; first match wins. Every implementation plan's "Architecture Placement"
section records the answer per new file.

1. Is it a wire shape (request/response/enum crossing HTTP)? → packages/contracts
   (+ /contract-change).
2. Is it stored schema? → packages/db via /migration, in the owning module's slice (Law 9).
3. Is it business logic, a policy number, a protocol constant, or a flow view-model both
   platforms read? → packages/domain (pure TS only).
4. Is it data access (fetch, cache, session store)? → packages/data (react only under
   src/react/).
5. Is it form state/validation wiring? → packages/forms.
6. Is it user-visible copy needed by both platforms? → packages/i18n/src/copy.
7. Is it a visual value (color, spacing, type scale)? → design/ds-source via
   packages/tokens — never a literal in a screen.
8. Is it a reusable visual component? → the design system pair: packages/ui (web) +
   apps/mobile/src/ui (RN) + its @heliogrid/ui-api contract entry, all in one change
   (Law 7).
9. Is it screen composition/rendering for one platform? → that app's screens/features
   tree, composing the layers above. Screens hold rendering, not policy.
10. Is it environment/config? → a schema in packages/env + .env.example (never a raw
    process.env read elsewhere).
11. None of the above fits → STOP. Name the mismatch to the owner before creating a new
    package or directory (00-laws.md stop-and-ask).
