---
paths:
  - "apps/web/**"
  - "apps/mobile/**"
---

# Both platforms — author the fact once (Law 11)

Before writing a constant, type, hook or copy string in a screen, ask which package owns it
(`docs/architecture.md` §4). Screens are the unguarded surface: almost nothing here is gated.

- **Shared state vocabulary and view-model types live in `@heliogrid/domain`** and are
  imported by both controllers; the store that fills them lives in `@heliogrid/data`. The
  login flow drifted into five renamed fields and an inverted `online`/`offline` polarity
  because each platform named its own.
- **Data reaches a screen through `@heliogrid/data`.** No `@ts-rest/*`, no auth client, no
  raw HTTP client, no `fetch` wrapper of your own (`apps-never-touch-the-wire`, lint).
- **Form state comes from `@heliogrid/forms`** — `useZodForm`, `Controller`, and `z`. The
  app bundler's own `zod` is a different instance, so schemas built with it never get the
  translated error map.
- **Copy both platforms show lives in `packages/i18n/src/copy`**, imported by both. A msgid
  authored inline in two screens forks on a one-character edit and the extract guard passes
  green — it checks freshness, not cross-platform identity.
- **Never mix macro `<Trans>` and explicit-id usage for the same string** — the extractor
  forks them into duplicate `.po` entries and translations are lost. Biome bans the macro
  import; the diagnostic names the fix.
- **Never translate:** kW, kWh, kWp, brand names, utility/DISCOM proper nouns. Money renders
  with the tenant currency's market grouping in every locale (INR: lakh/crore) — never a
  locale-default separator.
- **Hindi and Marathi need 20–30% more width than English.** A layout that only fits English
  is not done.
- A behaviour that is deliberately different per platform is recorded in `docs/13` as a
  UXG-PAR row. Undocumented divergence is drift.
