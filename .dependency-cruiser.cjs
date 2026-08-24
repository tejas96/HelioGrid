/**
 * Layer rules from CLAUDE.md, enforced as config-as-code (docs/engineering/03 §3).
 * Dependency direction: apps/{web,mobile} → packages/data → packages/contracts →
 * packages/domain. apps/{api,worker} skip data and reach contracts directly — data is the
 * FRONTEND SDK, and the server implements the contract rather than consuming it.
 * packages/domain is pure TS — it imports nothing from db/api/ui/react/nest.
 * Do not weaken these rules; a needed new edge is a conscious decision + commit note.
 *
 * A rule here is only real once you have injected the violation it names and watched it
 * fail. Match the RESOLVED node_modules path for installed packages AND the bare specifier
 * for ones the importer does not declare — a pattern covering only one form is inert in
 * exactly the case it exists to catch. Four rules in this file were inert on that basis.
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
        path: '^(packages/(db|contracts|ui|i18n|adapters|theme)|apps)/',
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
      name: 'data-lean',
      severity: 'error',
      comment:
        'packages/data is the frontend SDK, not a dumping ground: it owns transport, the ts-rest client, repositories, session and cache and NOTHING else. Blocking the visual and persistence layers structurally is what stops "it is shared, put it in data" turning it into a God package — the failure mode this architecture is most likely to die of.',
      from: { path: '^packages/data/' },
      /*
       * BOTH the workspace SPECIFIER and the on-disk path. A package data does not depend
       * on cannot resolve, so it sits in the graph as the bare `@heliogrid/ui` string and a
       * `^packages/ui/` pattern never sees it — which is precisely the case this rule
       * guards (someone reaching for a layer that is not a declared dependency yet).
       * Verified by probe: matching the path alone left this rule inert.
       */
      to: {
        path: [
          '^@heliogrid/(db|ui|theme|i18n|adapters)',
          '^(packages/(db|ui|theme|i18n|adapters)|apps)/',
        ].join('|'),
      },
    },
    {
      name: 'data-core-is-framework-free',
      severity: 'error',
      comment:
        'React Query is an ADAPTER over the repositories, confined to packages/data/src/react. Repositories that know no framework are what let the query library be replaced without touching a repository or a screen. The boundary is a DIRECTORY prefix on purpose — a filename pattern would rot.',
      from: { path: '^packages/data/src/', pathNot: '^packages/data/src/react/' },
      /*
       * Matches the RESOLVED node_modules path, like `no-raw-http-clients` above — not the
       * bare specifier. Two ways this rule was silently inert before it was probed:
       * `dependencyTypes: ['npm']` skipped React Query (a dev + peer dependency here), and
       * `'^@tanstack/react-query$'` never matches an INSTALLED package, whose graph path is
       * the file it resolved to. A rule that matches nothing is worse than no rule.
       */
      to: { path: '(^|/)node_modules/(react|react-dom|@tanstack/react-query)/' },
    },
    {
      name: 'apps-never-touch-the-wire',
      severity: 'error',
      comment:
        'Screens reach the network through @heliogrid/data and nothing else. One screen calling the ts-rest client or an auth client directly "just this once" is how a layered data architecture erodes — so it is a build failure, not a review note. initClient is called exactly ONCE in this repository, in packages/data/src/client/client.ts.',
      from: { path: '^apps/(web|mobile)/' },
      /*
       * BOTH forms on purpose. These packages are no longer in either app's manifest, so an
       * import resolves to nothing and appears in the graph as the bare specifier — that is
       * the `^(@ts-rest/|better-auth)` half. If one is ever re-added to a manifest it would
       * resolve to a real file instead, which only the node_modules half catches. Matching
       * one form alone leaves the rule inert in exactly the case that matters.
       */
      to: { path: '(^|/)node_modules/(@ts-rest|better-auth)/|^(@ts-rest/|better-auth)' },
    },
    {
      name: 'forms-through-heliogrid-forms',
      severity: 'error',
      comment:
        'Screens build form state through @heliogrid/forms and nothing else (foundation-dx spec §2.2). A screen importing react-hook-form directly re-opens per-screen form wiring — the drift the package exists to end. Both match forms for the same reason as apps-never-touch-the-wire.',
      from: { path: '^apps/(web|mobile)/' },
      to: {
        path: '(^|/)node_modules/(react-hook-form|@hookform)/|^(react-hook-form($|/)|@hookform/)',
      },
    },
    {
      name: 'theme-standalone',
      severity: 'error',
      comment:
        'theme is GENERATED from the live design system (docs/engineering/17 §6) and depends on nothing in the workspace. Renamed from tokens-standalone 2026-08-19; the v1 packages/tokens was deleted with the v1 design system.',
      from: { path: '^packages/theme/' },
      // `[^/]+` after the lookahead is load-bearing. The obvious `^(packages/(?!tokens)|apps)/`
      // is DEAD: its first branch already ends in `/`, so the trailing `/` demanded
      // `packages//` and the rule matched nothing for years. Unlike its sibling layer rules
      // this one lists no package names — "depends on nothing in the workspace" must keep
      // holding for packages that do not exist yet.
      //
      // Probed 2026-08-19, the day the package landed — and the single-form pattern WAS
      // inert for the likely violation: an import of a workspace package theme does not
      // declare cannot resolve, so it sits in the graph as the bare `@heliogrid/…` specifier
      // the packages/ pattern never sees (the same class data-lean documents). Both forms,
      // like every proven rule in this file. @heliogrid/config stays a dev-only tsconfig
      // preset — resolved by `extends`, never imported, so it needs no exemption here.
      to: {
        path: ['^@heliogrid/(?!theme($|/))', '^(packages/(?!theme/)[^/]+|apps)/'].join('|'),
      },
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
      /*
       * BOTH the bare workspace specifier and the on-disk path. apps/web does not declare
       * @heliogrid/db, so an import of it CANNOT resolve and sits in the graph as the
       * literal string `@heliogrid/db` — a `^packages/db/` pattern never sees it. Verified
       * by probe on 2026-08-02: this rule had been inert since it was written.
       * `@heliogrid/db/uuid` stays exempt in both forms: uuidv7 is a pure randomBytes
       * helper with no connection, so importing it is not database access.
       */
      to: {
        path: '^@heliogrid/db|^packages/db/',
        pathNot: '(^|/)uuid\\.|^@heliogrid/db/uuid$',
      },
    },
    {
      name: 'web-app-imports-feature-barrel-only',
      severity: 'error',
      comment:
        'apps/web/app is ROUTING ONLY. A page may import a feature through its ' +
        'index barrel, or through a SCREEN barrel one level down — never a deep path into the ' +
        'feature. A deep import re-creates the scattering the feature folder exists to remove, ' +
        'and makes the barrel a lie. The screen barrel is not a loophole, it is required: a ' +
        "barrel that re-exports both a Server Component and a 'use client' screen puts the " +
        "client one's whole chunk into every page reaching the barrel (/design was 147 kB " +
        'instead of 102 kB), and no tree-shaking removes it. Two levels only — ' +
        '`<feature>/index` and `<feature>/<screen>/index`; `<screen>/components/index` and ' +
        'anything deeper stay internal.',
      from: { path: '^apps/web/app/' },
      to: {
        path: '^apps/web/features/([^/]+)/.+',
        // Alternation, NOT `([^/]+/)?index` — a `+` nested inside a `?` is star-height 2 and
        // dependency-cruiser's safe-regex check refuses to run the whole ruleset over it.
        pathNot: '^apps/web/features/[^/]+/(index|[^/]+/index)\\.(ts|tsx)$',
      },
    },
    {
      name: 'web-app-holds-no-components',
      severity: 'error',
      comment:
        'apps/web/app is ROUTING ONLY — no component, hook, or style may live under ' +
        'it. web-app-imports-feature-barrel-only (above) stops a page reaching INTO features/ ' +
        'the wrong way, but says nothing about a NEW satellite file created directly under app/ ' +
        'and imported locally — the old one-folder-per-route shape (page.tsx + components.tsx + ' +
        'styles.css) degraded silently exactly that way once already (388-line ' +
        'app/login/page.tsx) before this repo had a mechanism to stop it re-forming. This rule ' +
        'is that mechanism: app/ may import from app/ ONLY the Next.js reserved files that ' +
        'legitimately live there.',
      from: { path: '^apps/web/app/' },
      to: {
        path: '^apps/web/app/',
        pathNot:
          '(^|/)(layout|providers|error|loading|not-found|template)\\.tsx$|(^|/)route\\.ts$|(^|/)globals\\.css$',
      },
    },
    {
      name: 'web-feature-no-cross-internals',
      severity: 'error',
      comment:
        "One feature may not reach INTO another. Import the other feature's index " +
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
      // Same two-form match and the same uuid exemption as `web-no-db` above — and this
      // rule was inert for the same reason until 2026-08-02.
      to: {
        path: '^@heliogrid/db|^packages/db/',
        pathNot: '(^|/)uuid\\.|^@heliogrid/db/uuid$',
      },
    },
    {
      name: 'no-raw-http-clients',
      severity: 'error',
      comment:
        'apps/web and apps/mobile reach the API through @heliogrid/data ONLY — the sole ' +
        'initClient call is packages/data/src/client/client.ts (ADR-0023). A third-party ' +
        'HTTP client bypasses the contract, so contract drift stops being a compile error ' +
        'and becomes a runtime surprise. Complements — does NOT replace — the prose rule ' +
        'in apps/web/CLAUDE.md: that landmine was a native fetch() via an untyped api<T>(), ' +
        'which has no import for a bundler graph to catch. No exemptions: the four app-local ' +
        'client files this rule once anchored were deleted by ADR-0023/0024 (better-auth is ' +
        'banned outright by apps-never-touch-the-wire, not exempt).',
      from: {
        path: '^apps/(web|mobile)/',
      },
      to: {
        // NO dependencyTypes filter, exactly like apps-never-touch-the-wire. None of these
        // clients is installed, so the import cannot resolve and dependency-cruiser types it
        // `unknown` — a ['npm','npm-dev'] filter drops precisely the case this rule exists to
        // catch. Probed 2026-08-03: with the filter, an injected `import axios from 'axios'`
        // in apps/web cruised clean.
        //
        // BOTH path forms for the same reason: an unresolvable import stays a bare specifier
        // the node_modules half never sees, while an installed one resolves to
        // node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/… and only the first half sees it.
        path:
          '(^|/)node_modules/(axios|node-fetch|undici|superagent|got|ky)/' +
          '|^(axios|node-fetch|undici|superagent|got|ky)($|/)',
      },
    },
    {
      name: 'package-index-only',
      severity: 'error',
      comment:
        'apps reach a package ONLY through a path its package.json `exports` declares — never a deep source path (docs/engineering/02 §2). Generalises the former ui-index-only. theme is omitted deliberately: every one of its entry points is a declared subpath export.',
      from: { path: '^apps/' },
      to: {
        path: [
          '^packages/(ui|theme|db|i18n|domain|adapters)/src/(?!index)',
          '^packages/contracts/src/(?!index|jobs)',
          '^packages/data/src/(?!index|react/index)',
        ].join('|'),
      },
    },

    /* ---- Structure standard (docs/engineering/02 §2) --------------------------------------------
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
        'App.tsx composes providers and renders RootNavigator — it never imports a screen. This single rule permanently stops App.tsx regrowing a hand-rolled router.',
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
      path: '(^|/)(\\.next|\\.turbo)/|^apps/mobile/(ios|android|vendor)/',
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
