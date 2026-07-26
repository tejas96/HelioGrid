/**
 * THE shared catalog config (docs/10 §7.1) — one catalog, two consumers. Extraction
 * sweeps web, mobile and the ui package; catalogs live under src/ so tsc ships the
 * compiled messages in dist/.
 */
module.exports = {
  locales: ['en', 'hi', 'mr'],
  sourceLocale: 'en',
  format: 'po',
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: [
        '<rootDir>/../../apps/web/app',
        '<rootDir>/../../apps/web/lib',
        '<rootDir>/../../apps/mobile/src',
        '<rootDir>/../../apps/mobile/App.tsx',
        '<rootDir>/../../packages/ui/src',
      ],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  ],
};
