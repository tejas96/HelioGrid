> **Fate:** stays the one guide for adding a language; `packages/i18n/CLAUDE.md` points here.

# Adding a language

The playbook `F3-26` requires. Adding a language is configuration, never a product change. Do
these steps and nothing else; the diff touches no design token but the sans stack, no component,
and no product model beyond the list (`F3-28`).

1. **Add one entry** to `LANGUAGES` in `packages/domain/src/format/languages.ts`: its BCP-47 code,
   its own name and its direction — `es: { endonym: 'Español', dir: 'ltr' }`. Then build: the
   typecheck names each line still missing it — the web and phone catalog loaders in
   `packages/i18n/src/` and the phone's plural data in `packages/i18n/src/rn/index.ts`.
2. **Generate the migration:** `pnpm db:migration:new`. The `ui_language` enum is built from the
   set, so drizzle-kit writes the new value; the `enum-parity` invariant proves the two agree. An
   older build that meets the new language reads English (`uiLanguageOrSource`), and the person's
   stored choice is untouched.
3. **Translate.** `pnpm --filter @heliogrid/i18n extract` writes `src/locales/<code>/messages.po`
   with every line's `msgstr` empty; fill each one, with any tool. `pnpm check:catalogs` refuses an
   empty line (`lingui compile --strict`), and `packages/i18n/tests/catalog-messages.test.ts` a
   line whose `{slots}` differ from its English. Every plural message carries every category
   `Intl.PluralRules` names for the language (`tests/plural-forms.test.ts`).
4. **Give the script a face** if the stack does not draw it (`F3-13`, `F3-14`). In the design
   system: its `@font-face` and its family in `--font-sans`, then pull. In the theme: the variable
   woff2 in `packages/theme/assets/fonts/`. On the phone: one static instance per sanctioned
   weight, named `<Family>-<Weight>.ttf`, in `apps/mobile/assets/fonts/`, linked with
   `npx react-native-asset` for iOS; on Android the same faces go in
   `apps/mobile/android/app/src/main/res/font/` as `<family>_<weight>.ttf`, lowercase, beside a
   `<family>.xml` that maps each weight, and the family is registered in `MainApplication.kt`
   (the `language-fonts` invariant names what is missing). Then look at it on a device — only a
   device proves the phone links it. A language in a script already bundled (Latin, Devanagari)
   skips this step.
5. **Money: nothing to do.** `formatMoney` takes the market's pack and never a language (`F3-20`;
   `packages/domain/tests/format/languages.test.ts`).
6. **Check the densest screens** that exist — the BOM, the generated proposal document, the
   proposal builder, the lead list, the studio panels — rendered in the language at both
   viewports (`F3-18`). A reviewer judges this; no gate can.
7. **Ship when `pnpm check:all` is green.** Until then the language never reaches `main`, so the
   picker cannot offer it (`F3-27`).

Market texts — a registered SMS template, a pack label, the words a price-list import recognises
— are the market pack's data, not catalog copy. A language without them reads the English, and a
market that needs them adds them to its pack.
