> **Fate:** becomes a skill step when the agent harness is rebuilt; then this file is deleted.

# Adding a language

The playbook `F3-26` requires. Adding a language is configuration, never a product change. Do
these steps and nothing else; the diff touches no design token but the sans stack, no component,
and no product model beyond the list (`F3-28`).

1. **Add the code** to `UI_LANGUAGES` in `packages/domain/src/format/languages.ts`. The build then
   refuses until each registration exists — every `satisfies Record<UiLanguage, …>` the compiler
   names, `LANGUAGE_META`'s tag, endonym and direction among them. The plural polyfill line in
   `packages/i18n/src/rn/index.ts` is held by no type (`D47` in `docs/tasks/deferred.md`): add it
   by hand.
2. **Add the database value** with a migration: `ui_language` mirrors the set, and the
   `enum-parity` invariant proves it. The migration runs before machines roll; an older build that
   meets the new language reads English (`uiLanguageResponseSchema`, `uiLanguageOrSource`) and the
   person's stored choice is untouched.
3. **Translate.** `pnpm --filter @heliogrid/i18n extract` writes the new catalog. A gap falls back
   to English string by string (`F3-05`) — a partly translated language ships; an empty `msgstr`
   in a `.po` file is the gap to fill, and no gate counts them.
4. **Give the script a face** if the stack does not draw it (`F3-13`, `F3-14`). In the design
   system: its `@font-face` and its family in `--font-sans`, then pull. In the theme: the variable
   woff2 in `packages/theme/assets/fonts/`. On the phone: one static instance per sanctioned
   weight, named `<Family>-<Weight>.ttf`, in `apps/mobile/assets/fonts/`, linked with
   `npx react-native-asset` for iOS; on Android the same faces go in
   `apps/mobile/android/app/src/main/res/font/` as `<family>_<weight>.ttf`, lowercase, beside a
   `<family>.xml` that maps each weight, and the family is registered in `MainApplication.kt`
   (the `language-fonts` invariant names what is missing). Then look at it on a device — only a
   device proves the phone links it.
5. **Write the plurals.** Every plural message written in the language carries every category
   `Intl.PluralRules` names for it; a message still in English is a gap, not a failure.
6. **Money: nothing to do.** `formatMoney` takes the market's pack and never a language (`F3-20`;
   `packages/domain/tests/format/languages.test.ts`).
7. **Check the densest screens** that exist — the BOM, the generated proposal document, the
   proposal builder, the lead list, the studio panels — rendered in the language at both
   viewports (`F3-18`). A reviewer judges this; no gate can.
8. **Ship when `pnpm check:all` is green** — the `language-fonts` invariant and
   `packages/i18n/tests/plural-forms.test.ts` hold `F3-27`. Until then the language never reaches
   `main`, so the picker cannot offer it.
