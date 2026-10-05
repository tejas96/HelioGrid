# @heliogrid/i18n — ONE Lingui catalog (EN/HI/MR) for Next.js AND bare RN

Deps: `architecture.md` §2 i18n. `packages/ui` takes its copy as props.

## What lives here / what must never live here

- The @lingui and @formatjs dependencies live here only; never add them to an app.
- `src/copy/` modules are pure data — React-free, JSX banned, extractor-swept via leading
  `/*i18n*/` descriptors. Where a closed set exists the module is a `Record` over the contract
  enum. Screen-specific copy stays in its screen.
- NEVER: app copy hard-coded elsewhere, a per-app catalog, agent or WhatsApp templates (tenant
  DATA), or a raw Intl currency format.

## Where files go

```
src/copy/<area>.ts            copy BOTH platforms need — pure data, no React, no JSX
src/locales/<lang>/           messages.po (source of truth) + messages.ts (compiled by `build`, committed, never hand-edited)
src/index.ts                  REACT-FREE root — createI18nRuntime, createTranslator, metadata
src/languages.ts              LANGUAGE_META + the statically-imported source catalog
src/catalog-loader.ts         web: one import() chunk per language
src/catalog-loader.native.ts  RN: static imports — Metro substitutes it, because `import()`
                              cannot lazy-load on the phone
src/react/                    the ONE provider and hooks both platforms use
src/rn/                       Hermes Intl polyfills — global side effects, own entry
tests/                        unit tests of `runtime.ts` and the `copy/` functions, against the
                              REAL catalogs (`.claude/rules/testing.md`)
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

Run `extract` after any copy change.

## Local conventions

- **THE CONVENTION: runtime `<Trans id="<English source text>" />`** from `@heliogrid/i18n/react`,
  both platforms. The id IS the English string, so the first paint is right before any catalog
  loads.
- **The language SET is not written here.** `UI_LANGUAGES` is authored in
  `packages/domain/src/format/languages.ts` and re-exported by contracts, which is
  where this package and `lingui.config.js` still read it. `LANGUAGE_META` and both catalog
  loaders are `satisfies Record<UiLanguage, …>`.
- **The provider FOLLOWS the session.** A root mounts `LanguageFollowsUser` with
  `follow={user?.interfaceLanguage ?? null}` and `onChosen`; a screen calls `setLocale` and never
  writes the profile itself (`F3-02`, `F3-04`).
- **One instance per mount and per request. Never a module-scope one** — Next evaluates a module
  once per server process and shares it across every request, so a module-level `setupI18n()` is
  one mutable active locale for every concurrent visitor.
- `t(COPY.key, values)` in hooks and handlers — the descriptor itself, never `.id` · `<Trans>` in markup · `createTranslator(locale)` off the
  React tree. Store message IDs plus data, never a translated business record — that is wrong for
  every other reader of it.
- **UI language is per user; currency, tax and paperwork come from the tenant's market pack.**
  Never derive one from the other.

## Adding a language

Follow `docs/engineering/adding-a-language.md`; the `language-fonts` invariant and
`tests/plural-forms.test.ts` refuse a half-added one.

## Done means

`extract` leaves the tree clean · every locale has zero missing messages, or the gap is a
deliberate English fallback · every language RENDERED on web and both simulators, switching and
not merely loading.

## Traps

- Without the statically imported source catalog, `i18n.activate()` warns on every boot and a production build `console.warn`s on every fallback message → keep the static import in `languages.ts`.
