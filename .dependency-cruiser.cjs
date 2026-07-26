/**
 * Layer rules from CLAUDE.md, enforced as config-as-code (docs/03 §3).
 * Dependency direction: apps/* → packages/contracts → packages/domain.
 * packages/domain is pure TS — it imports nothing from db/api/ui/react/nest.
 * Do not weaken these rules; a needed new edge is a conscious decision + commit note.
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-purity-no-layers',
      severity: 'error',
      comment:
        'packages/domain is pure isomorphic TS: no db, no contracts, no apps, no ui (CLAUDE.md hard rule)',
      from: { path: '^packages/domain/' },
      to: {
        path: '^(packages/(db|contracts|ui|i18n|adapters|tokens)|apps)/',
      },
    },
    {
      name: 'domain-purity-no-frameworks',
      severity: 'error',
      comment:
        'domain may not import NestJS, React, zustand, fetch clients or storage (rules/domain.md)',
      from: { path: '^packages/domain/' },
      to: {
        dependencyTypes: ['npm'],
        path: '^(@nestjs|react|react-dom|react-native|zustand|axios|drizzle-orm|@powersync)',
      },
    },
    {
      name: 'contracts-lean',
      severity: 'error',
      comment: 'contracts depend on zod/ts-rest/domain types only — never db or apps',
      from: { path: '^packages/contracts/' },
      to: { path: '^(packages/(db|ui|adapters)|apps)/' },
    },
    {
      name: 'db-no-upward',
      severity: 'error',
      comment: 'db never imports contracts, ui or apps',
      from: { path: '^packages/db/' },
      to: { path: '^(packages/(contracts|ui|adapters)|apps)/' },
    },
    {
      name: 'tokens-standalone',
      severity: 'error',
      comment: 'tokens is generated from design/ds-source and depends on nothing in the workspace',
      from: { path: '^packages/tokens/' },
      to: { path: '^(packages/(?!tokens)|apps)/' },
    },
    {
      name: 'no-app-to-app',
      severity: 'error',
      comment: 'apps never import other apps; shared code lives in packages',
      from: { path: '^apps/([^/]+)/' },
      to: { path: '^apps/', pathNot: '^apps/$1/' },
    },
    {
      name: 'web-no-db',
      severity: 'error',
      comment: 'apps/web is frontend only — no direct db access, everything through contracts',
      from: { path: '^apps/web/' },
      to: { path: '^packages/db/' },
    },
    {
      name: 'mobile-no-db',
      severity: 'error',
      comment: 'apps/mobile data access goes through repository interfaces, never packages/db',
      from: { path: '^apps/mobile/' },
      to: { path: '^packages/db/' },
    },
    {
      name: 'ui-index-only',
      severity: 'error',
      comment: 'app SCREENS consume the component libraries through their index only',
      from: { path: '^apps/', pathNot: '^apps/mobile/src/ui/' },
      to: { path: '(^packages/ui/src/(?!index)|^apps/mobile/src/ui/(?!index))' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: '(^|/)(dist|\\.next|\\.turbo|node_modules)/|^design/|^apps/mobile/(ios|android|vendor)/',
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
