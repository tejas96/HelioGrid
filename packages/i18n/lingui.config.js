/**
 * THE shared catalog config — one catalog, two consumers. Extraction sweeps web, mobile and
 * the ui package; catalogs live under src/ so tsc ships the compiled messages in dist/.
 *
 * The locale list is READ FROM THE CONTRACT, never restated. It is loaded from the BUILT
 * `@heliogrid/contracts` dist because this file is CommonJS and runs outside any TS
 * pipeline — which means extraction depends on contracts being built first. `pnpm verify`
 * builds before it extracts, and `turbo.json` gives i18n's tasks the `^build` dependency.
 *
 * The failure is deliberately LOUD. A `try { require } catch { fallback list }` here would
 * mean a stale or unbuilt contract silently extracts against the wrong set of locales, and
 * a language would go missing from the catalogs with every gate green.
 */
const { UI_LANGUAGES, UI_SOURCE_LOCALE } = require('@heliogrid/contracts');

if (!Array.isArray(UI_LANGUAGES) || UI_LANGUAGES.length === 0) {
  throw new Error(
    'lingui.config.js: @heliogrid/contracts exports no UI_LANGUAGES. Build contracts first ' +
      '(`pnpm turbo build --filter @heliogrid/contracts`); do NOT add a local locale list.',
  );
}

module.exports = {
  locales: [...UI_LANGUAGES],
  sourceLocale: UI_SOURCE_LOCALE,
  format: 'po',
  // Default orderBy: 'message' compares entry.message, which is EMPTY for every
  // explicit-id message (<Trans id="English text"/> — THE CONVENTION here, see
  // packages/i18n/CLAUDE.md). Every comparison returns 0, so the sort is a no-op and
  // Array#sort stability falls back to extraction-worker collection order, which is
  // non-deterministic once messages span multiple files (@lingui/cli catalog.js
  // orderByMessage). 'messageId' sorts on the id itself, which is always populated —
  // deterministic regardless of worker scheduling. Discovered when the auth/login move
  // (Task 3) split one file's strings across four component files (fix-round-1,
  // 2026-07-31): 5 consecutive `extract` runs produced 5 byte-identical catalogs.
  orderBy: 'messageId',
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: [
        '<rootDir>/../../apps/web/app',
        '<rootDir>/../../apps/web/features',
        '<rootDir>/../../apps/web/lib',
        '<rootDir>/../../apps/mobile/src',
        '<rootDir>/../../apps/mobile/App.tsx',
        '<rootDir>/../../packages/ui/src',
        // Scoped to copy/ so the compiled locale catalogs are never swept.
        '<rootDir>/src/copy',
      ],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  ],
};
