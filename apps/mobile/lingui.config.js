/**
 * Scaffold-local Lingui config — the shared catalog moves to packages/i18n with the
 * Track A auth slice (one catalog, two consumers); this file then points at it.
 */
module.exports = {
  locales: ['en', 'hi', 'mr'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['<rootDir>/src', '<rootDir>/App.tsx'],
    },
  ],
  format: 'po',
};
