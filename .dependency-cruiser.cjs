/**
 * Layer rules from CLAUDE.md, enforced as config-as-code (docs/03 §3).
 * Dependency direction: apps/* → packages/contracts → packages/domain.
 * packages/domain is pure TS — it imports nothing from db/api/ui/react/nest.
 * Do not weaken these rules; a needed new edge is a conscious decision + commit note.
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-purity-no-core-modules',
      severity: 'error',
      comment:
        'packages/domain may not import a Node builtin. `node:fs`/`node:crypto` looked gated ' +
        'but were caught only by the ACCIDENTAL absence of @types/node — adding that one ' +
        'devDependency (i18n and contracts both have it) would have made them compile clean. ' +
        'dependencyTypes core is the one matcher that fires on a builtin whether or not its ' +
        'types are installed. Isomorphic means it runs in a browser and on RN too.',
      from: { path: '^packages/domain/' },
      to: { dependencyTypes: ['core'] },
    },
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
        'domain may not import NestJS, React, zustand, fetch clients or storage (CLAUDE.md hard rules — domain purity)',
      from: { path: '^packages/domain/' },
      to: {
        // 'npm-dev' is included on purpose: this package ships SOURCE (main → src/index.ts),
        // so a devDependency import reaches consumers exactly like a production one. Proven
        // 2026-07-30 — with 'npm' alone a react devDependency import passed the cruise clean.
        dependencyTypes: ['npm', 'npm-dev'],
        // pnpm resolves to node_modules/.pnpm/<pkg>@<ver>_<hash>/node_modules/<pkg>/… —
        // a bare '^react' anchor never matches. Always anchor on the node_modules segment.
        path: '(^|/)node_modules/(@nestjs|react|react-dom|react-native|zustand|axios|drizzle-orm|@powersync)/',
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
      // `[^/]+` after the lookahead is load-bearing. The obvious `^(packages/(?!tokens)|apps)/`
      // is DEAD: its first branch already ends in `/`, so the trailing `/` demanded
      // `packages//` and the rule matched nothing for years. Unlike its sibling layer rules
      // this one lists no package names — "depends on nothing in the workspace" must keep
      // holding for packages that do not exist yet.
      to: { path: '^(packages/(?!tokens/)[^/]+|apps)/' },
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
      // `@heliogrid/db/uuid` is exempt: uuidv7 is a pure randomBytes helper with no
      // connection, so importing it is not database access.
      to: { path: '^packages/db/', pathNot: '(^|/)uuid\\.' },
    },
    {
      name: 'web-app-imports-feature-barrel-only',
      severity: 'error',
      comment:
        'apps/web/app is ROUTING ONLY (ADR-0022). A page may import a feature through its ' +
        'index barrel — never a deep path into the feature. A deep import re-creates the ' +
        'scattering the feature folder exists to remove, and makes the barrel a lie.',
      from: { path: '^apps/web/app/' },
      to: {
        path: '^apps/web/features/([^/]+)/.+',
        pathNot: '^apps/web/features/[^/]+/index\\.(ts|tsx)$',
      },
    },
    {
      name: 'web-feature-no-cross-internals',
      severity: 'error',
      comment:
        "One feature may not reach INTO another (ADR-0022). Import the other feature's index " +
        'barrel, or — if the thing is genuinely shared — move it to packages/ui (visual), ' +
        'packages/domain (logic) or apps/web/lib (app infrastructure).',
      // `pathNot` carries the $1 backreference, NOT a lookahead inside `path`. This mirrors the
      // proven `no-app-to-app` rule twenty lines up. A backreference inside a negative lookahead
      // is the shape that silently matches nothing — `tokens-standalone` was dead for exactly
      // that class of reason until 2026-07-30, so verify this one fires (Step 3a) rather than
      // assuming it does.
      from: { path: '^apps/web/features/([^/]+)/' },
      to: {
        path: '^apps/web/features/[^/]+/.+',
        pathNot: '^(apps/web/features/$1/|apps/web/features/[^/]+/index\\.(ts|tsx)$)',
      },
    },
    {
      name: 'mobile-no-db',
      severity: 'error',
      comment: 'apps/mobile data access goes through repository interfaces, never packages/db',
      from: { path: '^apps/mobile/' },
      // `@heliogrid/db/uuid` is exempt: uuidv7 is a pure randomBytes helper with no
      // connection, so importing it is not database access.
      to: { path: '^packages/db/', pathNot: '(^|/)uuid\\.' },
    },
    {
      name: 'no-raw-http-clients',
      severity: 'error',
      comment:
        'apps/web and apps/mobile reach the API through the typed ts-rest client ONLY ' +
        '(apps/web/lib/api-client.ts, apps/mobile/src/data/api-client.ts). A third-party ' +
        'HTTP client bypasses the contract, so contract drift stops being a compile error ' +
        'and becomes a runtime surprise. Complements — does NOT replace — the prose rule ' +
        'in apps/web/CLAUDE.md: that landmine was a native fetch() via an untyped api<T>(), ' +
        'which has no import for a bundler graph to catch. Auth clients are exempt: Better ' +
        'Auth owns its own transport.',
      from: {
        path: '^apps/(web|mobile)/',
        // FULLY ANCHORED to the four real files. As unanchored substrings these matched any
        // path CONTAINING them — `apps/web/app/auth/client.tsx` (the App Router convention
        // for a route's client component, which the auth rebuild will land under an `auth/`
        // segment) was silently exempt from the whole rule, as was any `api-client.*.ts` in
        // any `lib/` directory.
        pathNot:
          '^(apps/web/lib/api-client\\.ts|apps/mobile/src/data/api-client\\.ts|' +
          'apps/web/lib/auth-client\\.ts|apps/mobile/src/auth/client\\.ts)$',
      },
      to: {
        // 'npm-dev' for the same reason as domain-purity-no-frameworks: a devDependency import
        // is still an import, and 'npm' alone silently ignores it.
        dependencyTypes: ['npm', 'npm-dev'],
        // pnpm resolves to node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/… —
        // always anchor on the node_modules segment (see domain-purity-no-frameworks).
        path: '(^|/)node_modules/(axios|node-fetch|undici|superagent|got|ky)/',
      },
    },
    {
      name: 'package-index-only',
      severity: 'error',
      comment:
        'apps reach a package ONLY through a path its package.json `exports` declares — never a deep source path (docs/02 §2). Generalises the former ui-index-only. tokens is omitted deliberately: every one of its entry points is a declared subpath export.',
      from: { path: '^apps/', pathNot: '^apps/mobile/src/ui/' },
      to: {
        path: [
          '^packages/(ui|db|i18n|domain|adapters)/src/(?!index)',
          '^packages/contracts/src/(?!index|jobs)',
          '^apps/mobile/src/ui/(?!index)',
        ].join('|'),
      },
    },

    /* ---- Structure standard (docs/02 §2) --------------------------------------------
     * Every rule in this file is `error`. The former `warn` tier — "a rule today's code
     * still violates, flipping to error in the slice that fixes it" — is gone: the
     * restructure landed, and a permanently-warning rule is one nobody acts on. */
    {
      name: 'db-access-in-repositories-only',
      severity: 'error',
      comment:
        'packages/db is importable ONLY by *.repository.ts (+ common/db, scripts). Services take repositories by DI and never see a tx or a table. This is what makes "every query path is tenant-scoped" a lint result instead of a hope.',
      from: {
        path: '^apps/(api|worker|voice)/src/',
        pathNot: '(\\.repository\\.ts$|^apps/[^/]+/src/common/db/|^apps/[^/]+/src/scripts/)',
      },
      // `@heliogrid/db/uuid` is exempt: uuidv7 is a pure randomBytes helper with no
      // connection, so importing it is not database access.
      to: { path: '^packages/db/', pathNot: '(^|/)uuid\\.' },
    },
    {
      name: 'drizzle-in-repositories-only',
      severity: 'error',
      comment: 'the ORM itself is fenced with the same boundary as packages/db.',
      from: {
        path: '^apps/(api|worker|voice)/src/',
        pathNot: '(\\.repository\\.ts$|^apps/[^/]+/src/common/db/|^apps/[^/]+/src/scripts/)',
      },
      to: { dependencyTypes: ['npm'], path: '(^|/)node_modules/drizzle-orm/' },
    },
    {
      name: 'admin-pool-fenced',
      severity: 'error',
      comment:
        'the cross-tenant ADMIN pool bypasses RLS — only *.admin.repository.ts and common/db itself may reach it. Inert until migration step 4 creates common/db/; landed now so the fence exists BEFORE the code does.',
      from: {
        path: '^apps/',
        pathNot: '(\\.admin\\.repository\\.ts$|^apps/[^/]+/src/common/db/)',
      },
      to: { path: '^apps/[^/]+/src/common/db/admin' },
    },
    {
      name: 'api-module-boundary',
      severity: 'error',
      comment:
        'a module reaches another module ONLY through its <module>.public.ts — never a service class. This is the one-change-one-file property: a service signature change cannot ripple across modules because the caller only ever saw the public surface.',
      from: { path: '^apps/(api|worker|voice)/src/modules/([^/]+)/' },
      to: {
        path: '^apps/[^/]+/src/modules/',
        pathNot: '(^apps/[^/]+/src/modules/$2/|\\.public\\.ts$)',
      },
    },
    {
      name: 'common-imports-no-modules',
      severity: 'error',
      comment:
        'common/ is framework plumbing beneath the modules — it may never import one. A guard that needs module behaviour depends on a PORT (token + interface in contracts) that the module implements.',
      from: { path: '^apps/(api|worker|voice)/src/common/' },
      to: { path: '^apps/[^/]+/src/modules/' },
    },
    {
      name: 'bullmq-fenced',
      severity: 'error',
      comment:
        'queue machinery lives in processors/schedulers and common/queue only — a module never constructs a Queue itself (worker.module.ts registers the root connection).',
      from: {
        path: '^apps/',
        pathNot:
          '(\\.processor\\.ts$|\\.scheduler\\.ts$|^apps/[^/]+/src/common/queue/|^apps/worker/src/worker\\.module\\.ts$)',
      },
      to: { dependencyTypes: ['npm'], path: '(^|/)node_modules/(bullmq|@nestjs/bullmq)/' },
    },
    {
      name: 'mobile-app-entry-thin',
      severity: 'error',
      comment:
        'App.tsx composes providers and renders RootNavigator — it never imports a screen. This single rule permanently stops App.tsx regrowing a hand-rolled router (ADR-0020).',
      from: { path: '^apps/mobile/App\\.tsx$' },
      to: { path: '^apps/mobile/src/screens/' },
    },
    {
      name: 'no-tests-in-apps',
      severity: 'error',
      comment:
        'testing policy is deliberately thin (CLAUDE.md §Testing): the ONLY executable checks are tests/invariants and on-demand scripts/. This comment used to say colocated tests live in packages/domain — that predates the owner no-unit-tests directive (2026-07-29) and was stale by the time packages/domain actually existed.',
      from: { path: '^apps/.*\\.(test|spec)\\.(ts|tsx)$' },
      to: { path: '.*' },
    },
    {
      name: 'adapters-no-domain-internals',
      severity: 'error',
      comment:
        'adapters implement ports (contracts/src/ports) and may use domain only through its index — never reach into an engine.',
      from: { path: '^packages/adapters/' },
      to: { path: '^packages/domain/src/(?!index)' },
    },

    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    /*
     * doNotFollow vs exclude — this distinction is load-bearing, do not collapse it.
     * `exclude` deletes the module from the graph, so NO rule can ever match it;
     * `doNotFollow` keeps it as a node (rules match) but does not traverse into it.
     * node_modules and dist were previously EXCLUDED, which silently made every
     * npm-targeting rule (domain-purity-no-frameworks) and every rule aimed at a
     * dist-shipping workspace package (web-no-db, mobile-no-db, contracts-lean)
     * unable to fire — they passed because their targets were invisible, not absent.
     */
    doNotFollow: { path: '(^|/)(node_modules|dist)/' },
    exclude: {
      path: '(^|/)(\\.next|\\.turbo)/|^design/|^apps/mobile/(ios|android|vendor)/',
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
