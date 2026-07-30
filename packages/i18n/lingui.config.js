/**
 * THE shared catalog config (docs/10 §7.1) — one catalog, two consumers. Extraction
 * sweeps web, mobile and the ui package; catalogs live under src/ so tsc ships the
 * compiled messages in dist/.
 */
module.exports = {
  locales: ['en', 'hi', 'mr'],
  sourceLocale: 'en',
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
      ],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  ],
};
