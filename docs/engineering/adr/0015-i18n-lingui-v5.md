# ADR-0015: i18n — Lingui v5, one catalog for Next.js and bare React Native

Date: 2026-07-24 · Updated: 2026-08-25 (entry-point split, per-mount instances, forked catalog loader)

## Context

Hard requirements: one message catalog (EN/HI/MR) shared by Next.js App Router (including RSC) and bare React Native; per-user language switching that re-renders the whole app immediately (D25 — a Marathi surveyor and an English owner in the same company); Devanagari rendering; ICU plurals; ₹ Indian grouping and untranslated kW/kWh/kWp everywhere (enforced by product law, not the i18n library).

## Decision

**Lingui v5, single catalog in `packages/i18n`.** Compile-based (small bundles, ICU MessageFormat native) with a lightweight runtime for per-user locale switching. Next.js App Router + RSC officially supported. On bare RN: `@lingui/metro-transformer` (verified without Expo, RN ≥0.73) — set `transformer.babelTransformerPath`, add `po`/`pot` to `resolver.sourceExts`, install `@formatjs/intl-locale` + `@formatjs/intl-pluralrules` polyfills. Devanagari via the Noto Sans Devanagari chain with explicit RN fallback handling.

**Shape, as built 2026-08-25.** Three entry points of ONE package: `.` is React-free and
exposes `createTranslator(locale)` for a server render or a job; `./react` owns the provider,
the hooks and the re-exported `<Trans>`; `./rn` isolates the Hermes Intl polyfills, whose
global side effects must never enter a web bundle. The package owns the `@lingui` and
`@formatjs` dependencies outright — neither app declares them.

**Catalog loading is platform-forked, and that is not a workaround.** `catalog-loader.ts`
uses `import()`, so webpack emits one chunk per language and an inactive catalog never
reaches the initial page. `catalog-loader.native.ts` imports all three statically, because
React Native ships ONE bundle: a release build inlines the `import()`, but against the dev
server the same call goes through `__loadBundleAsync` and throws
`LoadBundleFromServerError` — proven on the iOS simulator. A loader that works only in
release builds is worse than no lazy loading. The two hosts have genuinely different loading
models; one signature hides that from everything above.

## Consequences

- Uniquely satisfies "one catalog, both platforms" with compile-time extraction — the only compile-time option covering RN at all.
- Key type-safety is via extraction + `messages.ts`, not typed functions (Paraglide's strength we forgo); natural-language message IDs mean copy edits change IDs — extraction discipline required.
- The metro transformer is flagged relatively new/beta and is `.po`/`.pot`-only — pinned versions and a smoke check in the mobile CI lane.
- Per-user immediate re-render is a runtime switch, honouring D25 without reloads.

## Alternatives rejected

- **Paraglide (inlang)** — best-in-class type safety, but no first-class React Native support; dealbreaker for the field app.
- **i18next** — runs everywhere but runtime-heavy, and key type-safety needs manual declaration-merging boilerplate agents get wrong.
- **FormatJS/react-intl** — heavier and weaker RN DX.

## Sources

- https://lingui.dev/ref/metro-transformer · https://lingui.dev/tutorials/react-native · https://lingui.dev/tutorials/react-rsc
- https://lingui.dev/blog/2024/11/28/announcing-lingui-5.0
