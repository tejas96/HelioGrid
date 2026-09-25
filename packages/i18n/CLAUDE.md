# @heliogrid/i18n — ONE Lingui catalog (EN/HI/MR) for Next.js AND bare RN

Traps: `.claude/landmines.md` · deps:
`architecture.md` §2 i18n. `packages/ui` stays string-free: copy arrives as props.

## What lives here / what must never live here

- The `.po` catalogs (the translation source of truth) and their COMPILED `messages.ts` · the
  `LANGUAGE_META` table · the catalog loaders · the runtime and translator factories · the ONE
  React provider both platforms use · the Hermes Intl polyfills · `src/copy/` for copy both
  platforms render.
- The `@lingui` and `@formatjs` DEPENDENCIES. Neither app declares them, so swapping the message
  library touches `src/react/` and nothing in either app.
- `src/copy/` modules are pure data — React-free, JSX banned, extractor-swept via leading
  `/*i18n*/` descriptors. Where a closed set exists the module is a `Record` over the contract
  enum. Screen-specific copy stays in its screen.
- NEVER: app copy hard-coded elsewhere, a per-app catalog, the language LIST (that is
  the re-export in `packages/contracts/src/locale.ts`), agent or WhatsApp templates (those are tenant DATA), or a
  raw Intl currency format.

## Where files go

```
src/copy/<area>.ts            copy BOTH platforms need — pure data, no React, no JSX
src/locales/<lang>/           messages.po (source of truth) + messages.ts (compiled, committed)
src/index.ts                  REACT-FREE root — createI18nRuntime, createTranslator, metadata
src/languages.ts              LANGUAGE_META + the statically-imported source catalog
src/catalog-loader.ts         web: one import() chunk per language
src/catalog-loader.native.ts  RN: static imports (Metro substitutes it — see the landmine)
src/react/                    the ONE provider and hooks both platforms use
src/rn/                       Hermes Intl polyfills — global side effects, own entry
tests/runtime.test.ts         the fallback and per-reader proofs, against the REAL catalogs — the
                              one unit-tested file here (`.claude/rules/testing.md`)
```

## Three entry points

`.` is REACT-FREE — `createI18nRuntime(locale)` for a mount, `createTranslator(locale)` for
isolated server or background work, plus the metadata and copy modules. `./react` is the provider
and hooks. `./rn` is the Hermes polyfills, separate because importing it INSTALLS GLOBALS a web
bundle must never take.

## Commands

```
pnpm --filter @heliogrid/i18n extract | build | typecheck   # extract sweeps web, mobile and ui
```

Run `extract` before committing: CI fails if the catalogs are not fresh (`M47`).

## Local conventions

- **THE CONVENTION: runtime `<Trans id="<English source text>" />`** on both platforms, from
  `@heliogrid/i18n/react`. The id IS the English string, so ids double as msgids and the extractor
  keeps ONE entry per message. Never mix macro `<Trans>` and explicit-id usage for the same
  string — the extractor forks them into duplicate entries and translations are lost. It is also
  why the first paint is correct with no catalog fetched: a missing message renders its id.
- **The language SET is not written here.** `UI_LANGUAGES` is authored in
  `packages/domain/src/format/languages.ts` and re-exported by contracts, which is
  where this package and `lingui.config.js` still read it. `LANGUAGE_META` and both catalog
  loaders are `satisfies Record<UiLanguage, …>` (`M48`).
- **The provider FOLLOWS the session.** A root passes `follow={user?.interfaceLanguage ?? null}`
  and persists only on `source === 'user'` in `onLocaleChange`; a screen calls `setLocale` and
  never writes the profile itself — the store is the one persist path (`F3-02`, `F3-04`).
- **One instance per mount and per request. Never a module-scope one** — Next evaluates a module
  once per server process and shares it across every request, so a module-level `setupI18n()` is
  one mutable active locale for every concurrent visitor.
- `t(COPY.key, values)` in hooks and handlers — the descriptor itself, never `.id` · `<Trans>` in markup · `createTranslator(locale)` off the
  React tree. Store message IDs plus data, never a translated business record — that is wrong for
  every other reader of it.
- **UI language is not the tenant MARKET.** Language is per user; currency grouping, tax scheme
  and paperwork come from the market pack. A Marathi-reading user in an Indian tenant still sees
  INR in lakh/crore. Never derive one from the other.
- The catalog loader is platform-FORKED and has to be: web uses `import()` so webpack splits one
  chunk per language, and `catalog-loader.native.ts` imports all three statically.
- Compiled `messages.ts` files are generated. Never hand-edit them.

## Adding a language — the playbook (`F3-26`)

Configuration, never a product change. Do these steps and nothing else; the diff touches no
design token but the sans stack, no component, and no product model beyond the list (`F3-28`).

1. **Add the code** to `UI_LANGUAGES` in `packages/domain/src/format/languages.ts`. The build then
   refuses until each registration exists — every `satisfies Record<UiLanguage, …>` the compiler
   names (`M48`), `LANGUAGE_META`'s tag, endonym and direction among them — and the plural polyfill
   line in `src/rn/index.ts` (`check:adherence` 9).
2. **Add the database value** with `/migration`: `ui_language` mirrors the set (`M17`). The
   migration runs before machines roll; an older build that meets the new language reads English
   (`uiLanguageResponseSchema`, `uiLanguageOrSource`) and the person's stored choice is untouched.
3. **Translate.** `pnpm --filter @heliogrid/i18n extract` writes the new catalog. A gap falls back
   to English string by string (`F3-05`) — a partly translated language ships, and
   `check:adherence` prints its gaps without failing (`M46`).
4. **Give the script a face** if the stack does not draw it (`F3-13`, `F3-14`). In the design
   system: its `@font-face` and its family in `--font-sans`, then pull. Here: the variable woff2
   in `packages/theme/assets/fonts/`. On the phone: one static instance per sanctioned weight,
   named `<Family>-<Weight>.ttf`, in `apps/mobile/assets/fonts/`, linked with
   `npx react-native-asset`. Then look at it on a device — only a device proves the phone links it.
5. **Write the plurals.** Every plural message written in the language carries every category
   `Intl.PluralRules` names for it; a message still in English is a gap, not a failure.
6. **Money: nothing to do.** `formatMoney` takes the market's pack and never a language (`F3-20`;
   `packages/domain/tests/format/languages.test.ts`).
7. **Check the densest screens** that exist — the BOM, the generated proposal document, the
   proposal builder, the lead list, the studio panels — rendered in the language at both
   viewports (`F3-18`). A reviewer judges this; no gate can.
8. **Ship when `pnpm check:languages` is green** (`F3-27`, `M135`). Until then the language never
   reaches `main`, so the picker cannot offer it.

## Done means

`extract` leaves the tree clean · every locale has zero missing messages, or the gap is a
deliberate English fallback · every language RENDERED on web and both simulators, switching and
not merely loading.
