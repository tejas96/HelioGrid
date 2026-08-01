# Auth Teardown to Greenfield + `@heliogrid/data` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove authentication from HelioGrid end to end — backend, contract, database and
client — while keeping both platforms' screens walkable, and replace the twice-authored
frontend data layer with one shared package, `@heliogrid/data`.

**Architecture:** A new workspace package with two entry points. `@heliogrid/data` holds the
transport, the single ts-rest client, repository interfaces and a framework-free session
store; `@heliogrid/data/react` holds the React Query adapter, the provider and the hooks.
Screens call hooks, hooks call repositories, repositories call the client, the client calls
the transport. Auth is deleted rather than relocated, leaving a `SessionStore` interface
with one deliberate walkthrough stub behind it for the Better Auth rebuild to replace.

**Tech Stack:** pnpm + Turborepo · TypeScript 5.8.3 · ts-rest 3.52.1 (`@ts-rest/core` only) ·
Zod 3.25.76 · TanStack Query 5.101.4 · Next.js 15.5.21 · bare React Native 0.86 (Metro 0.84) ·
NestJS · Drizzle · Biome · dependency-cruiser.

**Design of record:** `docs/superpowers/specs/2026-08-01-auth-teardown-and-data-package-design.md`

## Global Constraints

- **No unit tests. Ever.** Owner directive 2026-07-29. Never create a `.test.*` or `.spec.*`
  file — `scripts/check-adherence.sh` fails the build on one. The only executable checks are
  `tests/invariants/`. **Every "verify" step below runs the thing, not a test.**
- **Zero Biome warnings, zero Biome errors, zero typecheck errors, repo-wide.** `pnpm lint`
  runs Biome with `--error-on-warnings`. Never weaken a gate to pass.
- **Style, written not linted-after:** 2-space · LF · width 100 · semicolons · single quotes
  (JSX double) · trailing commas · organized imports · `import type` for types · no `any` ·
  no `!` · no `==` · no `console.log` · no unused symbols · `noUncheckedIndexedAccess` (array
  indexing yields `T | undefined`). Run `pnpm exec biome check --write <files>` before
  presenting each task.
- **Files ≲450 lines**, split by responsibility. Never `*-part2`, `*2`, `*-extra`.
- **`process.env` only where `scripts/check-env-access.mjs` allows.** `packages/data` reads
  no environment — `baseUrl` is passed in by each app.
- **Exact dependency pins.** `.npmrc` sets `save-prefix=`; no `^` or `~` in any version.
- **`zod` must be pinned to `3.25.76`** in every package that depends on `@ts-rest/core`.
  Without the explicit pin pnpm resolves ts-rest's peer to the transitive zod 4 and the typed
  client silently collapses to `never` (hit 2026-07-27).
- **Git is manual (CLAUDE.md §8).** Each task ends with a commit step written out in full,
  but **do not run it until the owner asks for a commit in those words.** Stage and report.
- **Copy is wrapped and translated.** Any user-visible string goes through `<Trans id="…">`
  or `i18n._()`; `lingui extract` must produce no diff at the end (CI gate).
- **Designs are frozen.** No screen, component, stylesheet, token or `packages/ui` visual may
  change. Only controller hooks and provider wiring are touched on the app side.

---

### Task 1: Move login constants and the tenant segment into `@heliogrid/domain`

Domain is the bottom layer — `packages/contracts` imports it, never the reverse (owner ruling
2026-07-30). Doing this first means every later task compiles against a stable home for these
facts. Domain has **no dependencies at all**, so the tenant segment becomes a readonly tuple
rather than a Zod enum.

**Files:**
- Create: `packages/domain/src/auth/otp.ts`
- Create: `packages/domain/src/tenancy/segment.ts`
- Modify: `packages/domain/src/index.ts`
- Modify: `packages/contracts/src/auth.ts` (delete the four constants and the segment schema)
- Modify: `packages/ui/package.json`, `packages/ui/src/composites/OtpInput.tsx`
- Modify: `apps/mobile/src/ui/composites/OtpInput.tsx`, `apps/mobile/src/screens/login/components/OtpStep.tsx`, `apps/mobile/src/screens/login/hooks/use-login.ts`
- Modify: `apps/web/features/auth/login/components/PhoneStep.tsx`, `apps/web/features/auth/login/hooks/use-login.ts`, `apps/web/features/auth/onboarding/OnboardingScreen.tsx`, `apps/web/features/auth/onboarding/hooks/use-onboarding.ts`

**Interfaces:**
- Produces: `OTP_LENGTH: 6`, `OTP_EXPIRY_SECONDS: 300`, `PHONE_NSN_LENGTH: 10`,
  `COUNTRY_CALLING_CODE: '+91'`, `TENANT_SEGMENTS: readonly ['residential','ci','both']`,
  `type TenantSegment` — all from `@heliogrid/domain`.

- [ ] **Step 1: Create the OTP constants file**

`packages/domain/src/auth/otp.ts`:

```ts
/**
 * Phone-OTP protocol constants. They described the WIRE while auth existed and shape the
 * UI now that it does not (owner ruling 2026-08-01, auth removed to greenfield). They live
 * HERE because domain is the bottom layer: when the contract is rebuilt it imports these,
 * which keeps one definition instead of a contract copy and a screen copy that drift.
 */
export const OTP_LENGTH = 6;
/** Seconds. Surfaced so client countdowns cannot disagree with the issuer. */
export const OTP_EXPIRY_SECONDS = 300;
/** India NSN length behind `+91`. India-first, global-ready: a second market turns this
 *  pair into injected market config — one definition either way. */
export const PHONE_NSN_LENGTH = 10;
export const COUNTRY_CALLING_CODE = '+91';
```

- [ ] **Step 2: Create the tenant segment file**

`packages/domain/src/tenancy/segment.ts`:

```ts
/**
 * What an EPC sells. A readonly tuple rather than a Zod enum because domain carries no
 * dependencies — the rebuilt contract will declare `z.enum(TENANT_SEGMENTS)` from this
 * exact list, so the two can never disagree.
 */
export const TENANT_SEGMENTS = ['residential', 'ci', 'both'] as const;
export type TenantSegment = (typeof TENANT_SEGMENTS)[number];
```

- [ ] **Step 3: Export both from the domain barrel**

In `packages/domain/src/index.ts`, add below the existing exports:

```ts
export {
  COUNTRY_CALLING_CODE,
  OTP_EXPIRY_SECONDS,
  OTP_LENGTH,
  PHONE_NSN_LENGTH,
} from './auth/otp';
export { TENANT_SEGMENTS } from './tenancy/segment';
export type { TenantSegment } from './tenancy/segment';
```

- [ ] **Step 4: Delete the originals from the contract**

In `packages/contracts/src/auth.ts` delete the `OTP_LENGTH`, `OTP_EXPIRY_SECONDS`,
`PHONE_NSN_LENGTH`, `COUNTRY_CALLING_CODE` declarations with their block comment, and the
`tenantSegmentSchema` / `TenantSegment` declarations. Leave the rest of the file — Task 8
deletes it wholesale, and deleting it now would break `apps/api`, which still compiles.

Wherever `auth.ts` used `tenantSegmentSchema` (e.g. inside `meSchema` / onboarding body),
replace it with `z.enum(TENANT_SEGMENTS)` and add the import:

```ts
import { TENANT_SEGMENTS } from '@heliogrid/domain';
```

Add `"@heliogrid/domain": "workspace:*"` to `packages/contracts/package.json` dependencies
if it is not already there.

- [ ] **Step 5: Repoint `packages/ui`**

Add `"@heliogrid/domain": "workspace:*"` to `packages/ui/package.json` dependencies. In
`packages/ui/src/composites/OtpInput.tsx` change line 2:

```ts
import { OTP_LENGTH } from '@heliogrid/domain';
```

- [ ] **Step 6: Repoint every remaining consumer**

Change the import source from `@heliogrid/contracts` to `@heliogrid/domain` in each of:

| File | Symbols |
|---|---|
| `apps/mobile/src/ui/composites/OtpInput.tsx` | `OTP_LENGTH` |
| `apps/mobile/src/screens/login/components/OtpStep.tsx` | `OTP_LENGTH` |
| `apps/mobile/src/screens/login/hooks/use-login.ts` | `COUNTRY_CALLING_CODE`, `PHONE_NSN_LENGTH` |
| `apps/web/features/auth/login/components/PhoneStep.tsx` | `PHONE_NSN_LENGTH` |
| `apps/web/features/auth/login/hooks/use-login.ts` | `COUNTRY_CALLING_CODE`, `PHONE_NSN_LENGTH` |
| `apps/web/features/auth/onboarding/hooks/use-onboarding.ts` | `TenantSegment` |

Several of these files already import from `@heliogrid/domain`; merge into the existing
import rather than adding a second one (Biome `organizeImports` will otherwise fail).

- [ ] **Step 7: Repoint the onboarding segment picker**

In `apps/web/features/auth/onboarding/OnboardingScreen.tsx` change line 2 to:

```ts
import { type TenantSegment, TENANT_SEGMENTS } from '@heliogrid/domain';
```

and change the options builder from `tenantSegmentSchema.options.map(...)` to:

```ts
const SEGMENT_OPTIONS = TENANT_SEGMENTS.map((value) => ({
  value,
  label: SEGMENT_LABEL[value],
}));
```

`SEGMENT_LABEL` stays `Record<TenantSegment, string>` — that is the landmine this shape
exists for, and the tuple preserves it exactly.

- [ ] **Step 8: Verify the whole workspace still typechecks and lints**

```bash
pnpm exec biome check --write packages/domain/src packages/contracts/src packages/ui/src apps/web apps/mobile/src
pnpm turbo typecheck
pnpm lint
```

Expected: both green. A failure naming `tenantSegmentSchema` means a consumer in Step 6/7 was
missed — re-run `grep -rn "tenantSegmentSchema\|OTP_LENGTH\|PHONE_NSN_LENGTH\|COUNTRY_CALLING_CODE" apps packages --include='*.ts' --include='*.tsx'` and repoint it.

- [ ] **Step 9: Verify both platforms still render the same**

Web: `pnpm --filter @heliogrid/web dev`, open `http://localhost:3002/login` — the phone field
still caps at 10 digits and the OTP step still renders 6 boxes. Open `/onboarding` — the
segment control still shows three options.
RN: `pnpm --filter @heliogrid/mobile ios` — the login screen renders 6 OTP boxes.

- [ ] **Step 10: Stage and commit (owner-gated)**

```bash
git add packages/domain packages/contracts packages/ui apps/web apps/mobile
git commit -m "refactor(domain): own the OTP protocol constants and tenant segment

Contracts imports domain, never the reverse (owner ruling 2026-07-30), so these
facts move down a layer ahead of the auth teardown that deletes the contract.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Scaffold `packages/data` — the framework-free core

Additive only. Nothing consumes it yet, so the whole task is safe to land before any teardown.

**Files:**
- Create: `packages/data/package.json`, `packages/data/tsconfig.json`, `packages/data/turbo.json`
- Create: `packages/data/src/transport/storage.ts`, `src/transport/transport.ts`
- Create: `packages/data/src/client/client.ts`
- Create: `packages/data/src/errors/errors.ts`
- Create: `packages/data/src/cache/keys.ts`
- Create: `packages/data/src/health/repository.ts`
- Create: `packages/data/src/index.ts`
- Modify: `turbo.json` (root — boundary tags)

**Interfaces:**
- Consumes: `apiContract`, `openErrorEnvelopeSchema`, `Liveness` from `@heliogrid/contracts`.
- Produces, module-internal: `createTransport(storage?: TokenStorage): ApiFetcher` ·
  `createApiClient(baseUrl: string, api: ApiFetcher): ApiClient` · `type ApiClient` ·
  `toApiError(res: { status: number; body: unknown }): ApiError` ·
  `createHealthRepository(api: ApiClient): HealthRepository`.
- Produces, exported from the barrel: `TokenStorage` · `ApiError` · `UnauthorizedError` ·
  `queryKeys` · `HealthRepository`.

- [ ] **Step 1: Create the manifest**

`packages/data/package.json`:

```json
{
  "name": "@heliogrid/data",
  "version": "0.0.1",
  "private": true,
  "description": "The frontend SDK — the ONLY data path for apps/web and apps/mobile (ADR-0023)",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "default": "./dist/react/index.js"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b"
  },
  "dependencies": {
    "@heliogrid/contracts": "workspace:*",
    "@heliogrid/domain": "workspace:*",
    "@ts-rest/core": "3.52.1",
    "zod": "3.25.76"
  },
  "peerDependencies": {
    "@tanstack/react-query": "5.101.4",
    "react": "19.2.3"
  },
  "devDependencies": {
    "@heliogrid/config": "workspace:*",
    "@tanstack/react-query": "5.101.4",
    "@types/react": "19.2.17",
    "react": "19.2.3",
    "typescript": "5.8.3"
  }
}
```

- [ ] **Step 2: Create the TypeScript and Turborepo config**

`packages/data/tsconfig.json` — note `.tsx` in `include` and the JSX setting; the shared
preset has neither because no package needed them before:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@heliogrid/config/tsconfig/node-package.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

`packages/data/turbo.json`:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "extends": ["//"],
  "tags": ["data"]
}
```

In the root `turbo.json`, add a `data` entry to `boundaries.tags` and add `"data"` to the
`app` tag's allow list:

```json
"data": {
  "dependencies": {
    "allow": ["data", "contracts", "domain", "config"]
  }
},
```

- [ ] **Step 3: Create the storage port**

`packages/data/src/transport/storage.ts`:

```ts
/**
 * PORT — credential storage is the ONE thing that cannot be shared. React Native has no
 * cookie jar, so it persists the session itself (keychain). Web deliberately has NO
 * implementation: its session is an HttpOnly first-party cookie that JavaScript cannot read
 * by design, and making it readable to satisfy this interface would be strictly worse
 * security. That is why `storage` is OPTIONAL on the data layer rather than required.
 */
export interface TokenStorage {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
  clear(): Promise<void>;
}
```

- [ ] **Step 4: Create the transport**

`packages/data/src/transport/transport.ts`. The cookie-jar logic is carried over verbatim
from `apps/mobile/src/auth/client.ts` — it is transport behaviour, not auth behaviour, and it
was verified the hard way (see its comment). Do not simplify it:

```ts
import { type ApiFetcher, tsRestFetchApi } from '@ts-rest/core';
import type { TokenStorage } from './storage';

type HeadersWithSetCookie = Headers & { getSetCookie?: () => string[] };

/**
 * Merge Set-Cookie rotations into the stored jar, keyed by cookie name.
 * Read with getSetCookie(), NEVER headers.get('set-cookie'): .get() joins multiple
 * Set-Cookie headers lossily and the server then rejects the session (hit 2026-07-26).
 */
async function absorbRotation(headers: Headers, storage: TokenStorage): Promise<void> {
  const getSetCookie = (headers as HeadersWithSetCookie).getSetCookie;
  const setCookies =
    typeof getSetCookie === 'function'
      ? getSetCookie.call(headers)
      : [headers.get('set-cookie')].filter((v): v is string => v !== null);
  if (setCookies.length === 0) return;

  const jar = new Map<string, string>();
  for (const pair of ((await storage.get()) ?? '').split('; ')) {
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
  for (const setCookie of setCookies) {
    const pair = setCookie.split(';')[0] ?? '';
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
  // Self-heal: cookie names and values never contain commas or spaces — drop anything a
  // pre-fix lossy join left behind in storage.
  for (const [name, value] of jar) {
    if (/[,\s]/.test(value) || /[,\s]/.test(name)) jar.delete(name);
  }
  if (jar.size === 0) return;
  await storage.set([...jar].map(([name, value]) => `${name}=${value}`).join('; '));
}

/**
 * EVERY request in both apps passes through here. Retry, logging, tracing and token refresh
 * land in THIS function and nowhere else — that is the whole reason this layer exists.
 * Without storage (web) the browser attaches the session cookie itself.
 */
export function createTransport(storage?: TokenStorage): ApiFetcher {
  if (!storage) return tsRestFetchApi;

  return async (args) => {
    const cookie = await storage.get();
    if (cookie) args.headers.cookie = cookie;
    const result = await tsRestFetchApi(args);
    await absorbRotation(result.headers, storage);
    return result;
  };
}
```

- [ ] **Step 5: Create the client — the one `initClient` in the repo**

`packages/data/src/client/client.ts`:

```ts
import { apiContract } from '@heliogrid/contracts';
import { type ApiFetcher, initClient } from '@ts-rest/core';

/**
 * THE typed client. `initClient` is called exactly ONCE in this repository — the
 * dependency-cruiser rule `apps-never-touch-the-wire` fails the build if an app reaches for
 * @ts-rest directly. This is @ts-rest/core, NOT @ts-rest/react-query: a framework-free core
 * client is what lets the React Query layer be replaced without touching a repository.
 */
export function createApiClient(baseUrl: string, api: ApiFetcher) {
  return initClient(apiContract, { baseUrl, baseHeaders: {}, api, credentials: 'include' });
}

export type ApiClient = ReturnType<typeof createApiClient>;
```

- [ ] **Step 6: Create the error layer**

`packages/data/src/errors/errors.ts`:

```ts
import { openErrorEnvelopeSchema } from '@heliogrid/contracts';

/** A non-2xx the server described with the canonical envelope. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Named separately so a caller can branch on "signed out" without matching on 401. */
export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Parse with the contract's OWN schema so no caller hand-declares the envelope shape.
 * This replaces web's `envelopeMessage(err)` helper: the message is already on the thrown
 * ApiError, so a second extraction function would be a redundant surface.
 */
export function toApiError(res: { status: number; body: unknown }): ApiError {
  const parsed = openErrorEnvelopeSchema.safeParse(res.body);
  const message = parsed.success ? parsed.data.error.message : `request failed (${res.status})`;
  return res.status === 401 ? new UnauthorizedError(message) : new ApiError(res.status, message);
}
```

- [ ] **Step 7: Create the query key factory**

`packages/data/src/cache/keys.ts`:

```ts
/**
 * Every query key in both apps. Centralised because scattered keys are how two screens end
 * up unable to invalidate each other's cache.
 */
export const queryKeys = {
  health: {
    liveness: ['health', 'liveness'] as const,
  },
} as const;
```

- [ ] **Step 8: Create the health repository**

`packages/data/src/health/repository.ts`:

```ts
import type { Liveness } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { toApiError } from '../errors/errors';

/**
 * ALL data access goes through a repository interface (forward-compat register, `mobile`
 * row). Track E swaps a PowerSync-backed implementation in behind this same interface — a
 * data-layer change only. No React, no React Query, no ts-rest type escapes here.
 */
export interface HealthRepository {
  liveness(): Promise<Liveness>;
}

/** The type is INFERRED from the contract, never a hand-written copy of the response. */
export function createHealthRepository(api: ApiClient): HealthRepository {
  return {
    async liveness() {
      const res = await api.health.liveness();
      if (res.status !== 200) throw toApiError(res);
      return res.body;
    },
  };
}
```

- [ ] **Step 9: Create the core barrel**

`packages/data/src/index.ts`:

```ts
/**
 * @heliogrid/data — the frontend SDK (ADR-0023). The ONLY data path for apps/web and
 * apps/mobile. This entry is framework-free: no React, no React Query, usable from a Next
 * server component or a script. The React adapter is `@heliogrid/data/react`.
 */
export { queryKeys } from './cache/keys';
export { ApiError, UnauthorizedError } from './errors/errors';
export type { HealthRepository } from './health/repository';
export type { TokenStorage } from './transport/storage';
```

`createApiClient`, `createTransport`, `createHealthRepository` and `toApiError` are
deliberately **not** exported. `createDataLayer` (Task 3) is the only construction entry an
app gets — re-exporting the client factory would hand apps back the raw wire that
`apps-never-touch-the-wire` exists to keep away from them.

- [ ] **Step 10: Install and build**

```bash
pnpm install
pnpm --filter @heliogrid/data build
```

Expected: `packages/data/dist/index.js` and `dist/index.d.ts` exist. A `never` type on
`api.health.liveness` means the zod pin is wrong — check `pnpm why zod` resolves 3.25.76.

- [ ] **Step 11: Verify gates**

```bash
pnpm exec biome check --write packages/data
pnpm lint
pnpm turbo typecheck
```

Expected: green.

- [ ] **Step 12: Stage and commit (owner-gated)**

```bash
git add packages/data turbo.json pnpm-lock.yaml
git commit -m "feat(data): scaffold the framework-free core of the frontend SDK

Transport, the single ts-rest client, error normalisation, query keys and the
health repository. No consumer yet — apps migrate in tasks 5 and 6.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Add the session store shape and the walkthrough stub

**Files:**
- Create: `packages/data/src/session/types.ts`, `packages/data/src/session/walkthrough.ts`
- Create: `packages/data/src/data-layer.ts`
- Modify: `packages/data/src/index.ts`

**Interfaces:**
- Consumes: `OtpFailure`, `OTP_LENGTH`, `PHONE_NSN_LENGTH` from `@heliogrid/domain` (Task 1).
- Produces: `SessionStatus` · `SessionUser` · `SessionSnapshot` · `SessionStore` ·
  `SessionApi` · `OtpResult` · `createWalkthroughSession(): SessionStore` ·
  `Repositories` · `DataLayer` · `DataLayerConfig` ·
  `createDataLayer(config: DataLayerConfig): DataLayer`.

- [ ] **Step 1: Create the session types**

`packages/data/src/session/types.ts`:

```ts
import type { OtpFailure } from '@heliogrid/domain';

export type SessionStatus = 'checking' | 'anonymous' | 'authenticated';

export interface SessionUser {
  id: string;
  name: string;
  phoneE164: string;
  /** Null until onboarding completes — the redirect rule both platforms already encode. */
  tenant: { id: string; name: string } | null;
}

export interface SessionSnapshot {
  status: SessionStatus;
  user: SessionUser | null;
}

/**
 * Outcome, not an exception: both login controllers branch on wrong-code (4xx) versus
 * transport failure, so the distinction belongs in the return type where typecheck sees it.
 * `failure` reuses domain's existing union — no new vocabulary.
 */
export type OtpResult = { ok: true } | { ok: false; failure: OtpFailure };

/**
 * Framework-free session state. It is a STORE, not a plain object: a bare `status` field
 * could never re-render a screen. The React layer reads it through useSyncExternalStore.
 * The Better Auth rebuild implements this interface and nothing in a screen changes.
 */
export interface SessionStore {
  getSnapshot(): SessionSnapshot;
  subscribe(listener: () => void): () => void;
  requestOtp(phoneE164: string): Promise<OtpResult>;
  verifyOtp(phoneE164: string, code: string): Promise<OtpResult>;
  signOut(): Promise<void>;
}

/** What `useSession()` returns — the snapshot flattened onto the three calls. */
export interface SessionApi extends SessionSnapshot {
  requestOtp(phoneE164: string): Promise<OtpResult>;
  verifyOtp(phoneE164: string, code: string): Promise<OtpResult>;
  signOut(): Promise<void>;
}
```

- [ ] **Step 2: Create the walkthrough stub**

`packages/data/src/session/walkthrough.ts`:

```ts
import { COUNTRY_CALLING_CODE, OTP_LENGTH, PHONE_NSN_LENGTH } from '@heliogrid/domain';
import type { OtpResult, SessionSnapshot, SessionStore, SessionUser } from './types';

/**
 * DELIBERATE STUB (owner ruling 2026-08-01). Auth was removed to greenfield and the login
 * designs on both platforms must stay walkable until the Better Auth rebuild lands. This
 * reaches NO server: it accepts any correctly shaped phone number and any OTP_LENGTH-digit
 * code. It is authored ONCE so neither app invents its own, and it is DELETED — not
 * adapted — when the real SessionStore implementation arrives.
 */
const WALKTHROUGH_USER: SessionUser = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Walkthrough User',
  phoneE164: `${COUNTRY_CALLING_CODE}0000000000`,
  tenant: { id: '00000000-0000-0000-0000-000000000001', name: 'Walkthrough Workspace' },
};

export function createWalkthroughSession(): SessionStore {
  // Starts 'anonymous', not 'checking': there is no persisted session to check for. The
  // 'checking' state stays in SessionStatus because the real implementation needs it, and
  // RootNavigator keeps its boot-spinner branch for that arrival.
  let snapshot: SessionSnapshot = { status: 'anonymous', user: null };
  const listeners = new Set<() => void>();

  const emit = (next: SessionSnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async requestOtp(phoneE164): Promise<OtpResult> {
      const nsn = phoneE164.slice(COUNTRY_CALLING_CODE.length);
      return nsn.length === PHONE_NSN_LENGTH ? { ok: true } : { ok: false, failure: 'resend-failed' };
    },
    async verifyOtp(_phoneE164, code): Promise<OtpResult> {
      if (code.length !== OTP_LENGTH) return { ok: false, failure: 'mismatch' };
      emit({ status: 'authenticated', user: WALKTHROUGH_USER });
      return { ok: true };
    },
    async signOut() {
      emit({ status: 'anonymous', user: null });
    },
  };
}
```

- [ ] **Step 3: Create the data layer factory**

`packages/data/src/data-layer.ts`:

```ts
import { createApiClient } from './client/client';
import { createHealthRepository, type HealthRepository } from './health/repository';
import type { SessionStore } from './session/types';
import { createWalkthroughSession } from './session/walkthrough';
import type { TokenStorage } from './transport/storage';
import { createTransport } from './transport/transport';

export interface Repositories {
  health: HealthRepository;
}

export interface DataLayerConfig {
  baseUrl: string;
  /** React Native only — web's session is an HttpOnly cookie the browser attaches itself. */
  storage?: TokenStorage;
}

export interface DataLayer {
  repositories: Repositories;
  session: SessionStore;
}

/**
 * Called ONCE per app, at the root. Apps never construct a repository, a client or a
 * transport themselves — they supply only what is genuinely platform-specific.
 */
export function createDataLayer({ baseUrl, storage }: DataLayerConfig): DataLayer {
  const api = createApiClient(baseUrl, createTransport(storage));
  return {
    repositories: { health: createHealthRepository(api) },
    session: createWalkthroughSession(),
  };
}
```

- [ ] **Step 4: Extend the barrel**

Add to `packages/data/src/index.ts`, keeping alphabetical import/export order:

```ts
export type { DataLayer, DataLayerConfig, Repositories } from './data-layer';
export { createDataLayer } from './data-layer';
export type {
  OtpResult,
  SessionApi,
  SessionSnapshot,
  SessionStatus,
  SessionStore,
  SessionUser,
} from './session/types';
```

`createWalkthroughSession` is **not** exported — `createDataLayer` is its only caller, and an
app that can construct its own session store is an app that can diverge from the other one.

- [ ] **Step 5: Build and verify**

```bash
pnpm --filter @heliogrid/data build
pnpm exec biome check --write packages/data
pnpm lint && pnpm turbo typecheck
```

Expected: green.

- [ ] **Step 6: Stage and commit (owner-gated)**

```bash
git add packages/data
git commit -m "feat(data): session store shape plus the walkthrough stub

SessionStore is framework-free and observable so useSyncExternalStore can read it.
createWalkthroughSession is a DELIBERATE stub with no server behind it; the Better
Auth rebuild deletes it and implements SessionStore instead.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Add the React adapter — `@heliogrid/data/react`

Everything React lives under `src/react/`, including feature hooks. Colocating a hook with
its repository would force the lint rule onto a filename pattern instead of a directory
prefix, and docs/17 is explicit that a fuzzy mechanism rots.

**Files:**
- Create: `packages/data/src/react/context.ts`, `provider.tsx`, `use-session.ts`, `use-health.ts`, `index.ts`

**Interfaces:**
- Consumes: `DataLayer` (Task 3), `queryKeys`, `Repositories`, `SessionApi`.
- Produces: `DataProvider` (props `{ layer: DataLayer; children: ReactNode }`) ·
  `useRepositories(): Repositories` · `useSession(): SessionApi` ·
  `useLiveness()` returning TanStack Query's `UseQueryResult<Liveness>`.

- [ ] **Step 1: Create the context**

`packages/data/src/react/context.ts`:

```ts
'use client';
import { createContext, useContext } from 'react';
import type { DataLayer, Repositories } from '../data-layer';

export const DataLayerContext = createContext<DataLayer | null>(null);

export function useDataLayer(): DataLayer {
  const layer = useContext(DataLayerContext);
  if (!layer) throw new Error('useDataLayer must be used inside <DataProvider>');
  return layer;
}

export function useRepositories(): Repositories {
  return useDataLayer().repositories;
}
```

- [ ] **Step 2: Create the provider**

`packages/data/src/react/provider.tsx`:

```tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import type { DataLayer } from '../data-layer';
import { DataLayerContext } from './context';

/** Query defaults live HERE — one definition for both platforms, which had drifted. */
function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });
}

export function DataProvider({ layer, children }: { layer: DataLayer; children: ReactNode }) {
  // useState initialiser, not a module constant: one client per mounted tree, created once.
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <DataLayerContext.Provider value={layer}>{children}</DataLayerContext.Provider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Create the session hook**

`packages/data/src/react/use-session.ts`:

```ts
'use client';
import { useSyncExternalStore } from 'react';
import type { SessionApi } from '../session/types';
import { useDataLayer } from './context';

/** The ONLY auth surface either app may see. */
export function useSession(): SessionApi {
  const { session } = useDataLayer();
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  return {
    ...snapshot,
    requestOtp: session.requestOtp,
    verifyOtp: session.verifyOtp,
    signOut: session.signOut,
  };
}
```

- [ ] **Step 4: Create the health hook**

`packages/data/src/react/use-health.ts`:

```ts
'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';

/** React Query lives ONLY in this directory. Replacing it touches these files and no
 *  repository, no screen — the coupling the design calls out as the adapter boundary. */
export function useLiveness() {
  const { health } = useRepositories();
  return useQuery({ queryKey: queryKeys.health.liveness, queryFn: () => health.liveness() });
}
```

- [ ] **Step 5: Create the React barrel**

`packages/data/src/react/index.ts`:

```ts
/**
 * @heliogrid/data/react — the React Query adapter. Swapping the query library touches
 * this directory and nothing else: repositories and screens are unaffected.
 */
export { useRepositories } from './context';
export { DataProvider } from './provider';
export { useLiveness } from './use-health';
export { useSession } from './use-session';
```

- [ ] **Step 6: Build and verify**

```bash
pnpm --filter @heliogrid/data build
```

Expected: `packages/data/dist/react/index.js` and `dist/react/index.d.ts` exist. If `tsc`
errors on the JSX, confirm `"jsx": "react-jsx"` landed in `packages/data/tsconfig.json`.

```bash
pnpm exec biome check --write packages/data
pnpm lint && pnpm turbo typecheck
```

- [ ] **Step 7: Stage and commit (owner-gated)**

```bash
git add packages/data
git commit -m "feat(data): React Query adapter, provider and hooks

Every React import in the package lives under src/react/, which is what lets the
adapter boundary be a directory-prefix lint rule rather than a filename pattern.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Cut `apps/web` over to `@heliogrid/data`

After this task no web file imports `better-auth` or `@ts-rest/*`. Auth still exists on the
backend; the web app simply stops talking to it.

**Files:**
- Delete: `apps/web/lib/auth-client.ts`, `apps/web/lib/api-client.ts`
- Modify: `apps/web/app/providers.tsx`, `apps/web/package.json`
- Modify: `apps/web/features/auth/login/hooks/use-login.ts`
- Modify: `apps/web/features/auth/onboarding/hooks/use-onboarding.ts`
- Modify: `apps/web/features/home/hooks/use-home.ts`, `apps/web/features/home/HomeScreen.tsx`

**Interfaces:**
- Consumes: `createDataLayer` from `@heliogrid/data`; `DataProvider`, `useSession` from
  `@heliogrid/data/react`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the dependency**

In `apps/web/package.json` dependencies: add `"@heliogrid/data": "workspace:*"`; remove
`"better-auth"`, `"@ts-rest/core"`, `"@ts-rest/react-query"`. **Keep**
`"@tanstack/react-query": "5.101.4"` and `"react": "19.2.3"` — they satisfy the new package's
peer dependencies. Then:

```bash
pnpm install
```

- [ ] **Step 2: Rewire the providers**

Replace `apps/web/app/providers.tsx` in full:

```tsx
'use client';
import { createDataLayer } from '@heliogrid/data';
import { DataProvider } from '@heliogrid/data/react';
import { type Locale, setupI18n } from '@heliogrid/i18n';
import { I18nProvider } from '@lingui/react';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { API_URL } from '../lib/env';

/**
 * App-wide providers: the shared data layer (transport, repositories, session) plus the
 * Lingui catalog (per-USER language, D25 — switching re-renders immediately).
 * No `storage`: the browser owns the session cookie (see TokenStorage in @heliogrid/data).
 */
const i18nInstance = setupI18n('en');
const dataLayer = createDataLayer({ baseUrl: API_URL });

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: 'en',
  setLocale: () => undefined,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const setLocale = useCallback((l: Locale) => {
    i18nInstance.activate(l);
    setLocaleState(l);
  }, []);

  return (
    <DataProvider layer={dataLayer}>
      <I18nProvider i18n={i18nInstance}>
        <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
      </I18nProvider>
    </DataProvider>
  );
}
```

- [ ] **Step 3: Delete the two client files**

```bash
git rm apps/web/lib/auth-client.ts apps/web/lib/api-client.ts
```

- [ ] **Step 4: Rewire the login controller**

In `apps/web/features/auth/login/hooks/use-login.ts`: delete the
`import { authClient } from '../../../../lib/auth-client';` line, add
`import { useSession } from '@heliogrid/data/react';`, and add `const session = useSession();`
beside the existing `const online = useOnline();`.

Replace `requestCode`:

```ts
const requestCode = useCallback(async () => {
  const result = await session.requestOtp(`${COUNTRY_CALLING_CODE}${phone}`);
  return result.ok;
}, [phone, session]);
```

Replace the body of `verify` — the try/catch goes away because `OtpResult` never throws:

```ts
const verify = useCallback(
  async (code: string) => {
    if (verifyInFlight.current) return;
    verifyInFlight.current = true;
    setVerifying(true);
    setFailure(null);
    const result = await session.verifyOtp(`${COUNTRY_CALLING_CODE}${phone}`, code);
    if (result.ok) setStep('done');
    else setFailure(result.failure);
    verifyInFlight.current = false;
    setVerifying(false);
  },
  [phone, session],
);
```

Change nothing else. The step machine, `otpEpoch` remount, `AUTO_VERIFY_DELAY_MS` timer,
resend countdown, call-offer threshold and every handler stay exactly as they are.

- [ ] **Step 5: Rewire the onboarding controller**

In `apps/web/features/auth/onboarding/hooks/use-onboarding.ts`, delete the
`import { api, envelopeMessage } from '../../../../lib/api-client';` line and the
`const onboarding = api.auth.completeOnboarding.useMutation();` line. Replace `busy` and
`submit`:

```ts
const [busy, setBusy] = useState(false);

/*
 * The completeOnboarding endpoint was removed with auth (owner ruling 2026-08-01). The
 * screen advances locally so the design stays walkable; the rebuild restores the mutation
 * here and nothing else in this file changes.
 */
const submit = async () => {
  setError(null);
  setBusy(true);
  router.push('/home');
};
```

- [ ] **Step 6: Rewire the home controller**

Replace `apps/web/features/home/hooks/use-home.ts` in full:

```ts
'use client';
import { useSession } from '@heliogrid/data/react';

/**
 * Post-login home controller. `api.auth.me` and `api.auth.listTeam` were removed with auth
 * (owner ruling 2026-08-01); identity now comes from the session and the team list returns
 * with the CRM module. The redirect rules return with the rebuild that owns them.
 */
export function useHome() {
  const { user } = useSession();
  return { user, members: [] as const };
}
```

- [ ] **Step 7: Adapt `HomeScreen.tsx` to the new controller — layout untouched**

In `apps/web/features/home/HomeScreen.tsx`: change the destructure to
`const { user, members } = useHome();`, delete the `meQuery.isLoading` and the
`!tenantReady` blocks, and replace the `me`/`meData` reads:

```tsx
if (!user)
  return (
    <main className="flex min-h-dvh items-center justify-center p-[var(--sp-4)]">
      <div className="w-full max-w-md">
        <Card>
          <p className="hm-error" role="alert">
            Could not load your workspace.
          </p>
        </Card>
      </div>
    </main>
  );
```

Then `me.tenant?.name` becomes `user.tenant?.name`, `me.user.name` becomes `user.name`,
`me.user.phoneE164` becomes `user.phoneE164`, and the roles line is removed (roles left with
the contract). Every `className` and every CSS file stays as it is — this is a data rewire,
not a design change. Remove the now-unused `Button` import if nothing else uses it.

- [ ] **Step 8: Verify no wire imports remain**

```bash
grep -rn "better-auth\|@ts-rest" apps/web --include='*.ts' --include='*.tsx'
```

Expected: no output.

- [ ] **Step 9: Verify gates and the running browser**

```bash
pnpm exec biome check --write apps/web
pnpm lint && pnpm turbo typecheck
pnpm --filter @heliogrid/web build
pnpm --filter @heliogrid/web dev
```

In the browser at `http://localhost:3002`:
- `/login` — enter 10 digits, Continue advances to the OTP step; entering 6 digits
  auto-verifies and reaches the done step; the resend countdown runs; "Change number"
  returns to the phone step with the number preserved.
- `/onboarding` — the segment control shows three options; submit lands on `/home`.
- `/home` — renders the greeting, workspace name and phone; the team section shows the
  "Just you so far" branch.
- `/design` and `/design/gallery` — unchanged.
- Console: no errors.

- [ ] **Step 10: Stage and commit (owner-gated)**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "refactor(web): consume @heliogrid/data, drop the local api and auth clients

Screens now reach the network through useSession/useLiveness only. No web file
imports better-auth or @ts-rest. Designs and stylesheets are untouched.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Cut `apps/mobile` over to `@heliogrid/data`

Highest-risk task: `@heliogrid/data` is the first workspace package to ship React to Metro,
and it uses a subpath export. Metro 0.84 (RN 0.86) enables package exports by default, so this
is expected to work — **verify it in Step 3 before rewiring anything else.**

**Files:**
- Delete: `apps/mobile/src/auth/client.ts`, `apps/mobile/src/data/api-client.ts`, `apps/mobile/src/data/repositories.ts`
- Modify: `apps/mobile/package.json`, `apps/mobile/App.tsx`
- Modify: `apps/mobile/src/auth/keychain-storage.ts`
- Modify: `apps/mobile/src/navigation/RootNavigator.tsx`
- Modify: `apps/mobile/src/screens/login/hooks/use-login.ts`

**Interfaces:**
- Consumes: `createDataLayer`, `TokenStorage` from `@heliogrid/data`; `DataProvider`,
  `useSession` from `@heliogrid/data/react`.
- Produces: `keychainStorage: TokenStorage`.

- [ ] **Step 1: Add the dependency**

In `apps/mobile/package.json` dependencies: add `"@heliogrid/data": "workspace:*"`; remove
`"better-auth"`, `"@ts-rest/core"`, `"@ts-rest/react-query"`. **Keep**
`"@tanstack/react-query": "5.101.4"`, `"react": "19.2.3"` and the explicit
`"zod": "3.25.76"` pin. Then:

```bash
pnpm install
```

- [ ] **Step 2: Make the keychain adapter satisfy `TokenStorage`**

Replace `apps/mobile/src/auth/keychain-storage.ts`:

```ts
import type { TokenStorage } from '@heliogrid/data';
import * as Keychain from 'react-native-keychain';

/**
 * The platform half of @heliogrid/data's TokenStorage port — the ONE piece of the data path
 * that cannot be shared. Keychain, never AsyncStorage, for anything credential-shaped.
 */
const SERVICE = 'heliogrid.auth.session';

export const keychainStorage: TokenStorage = {
  async get() {
    const creds = await Keychain.getGenericPassword({ service: SERVICE });
    return creds === false ? null : creds.password;
  },
  async set(value) {
    await Keychain.setGenericPassword('heliogrid', value, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
  },
  async clear() {
    await Keychain.resetGenericPassword({ service: SERVICE });
  },
};
```

- [ ] **Step 3: Mount the provider and prove Metro resolves the package — before anything else**

Replace `apps/mobile/App.tsx`, keeping whatever it already renders around `RootNavigator`
(i18n import first, gesture handler, safe-area provider — do not reorder them):

```tsx
import { createDataLayer } from '@heliogrid/data';
import { DataProvider } from '@heliogrid/data/react';
import { keychainStorage } from './src/auth/keychain-storage';
import { API_URL } from './src/env';
import { RootNavigator } from './src/navigation/RootNavigator';

/** RN supplies the one platform-specific piece — credential storage. Everything else in
 *  the data path is shared with web. */
const dataLayer = createDataLayer({ baseUrl: API_URL, storage: keychainStorage });

export default function App() {
  return (
    <DataProvider layer={dataLayer}>
      <RootNavigator />
    </DataProvider>
  );
}
```

Then, before touching any other file:

```bash
pnpm --filter @heliogrid/data build
pnpm --filter @heliogrid/mobile start --reset-cache
pnpm --filter @heliogrid/mobile ios
```

Expected: the app boots. **If Metro reports `Unable to resolve "@heliogrid/data/react"`,
package exports are not being honoured — add to `apps/mobile/metro.config.js` under
`resolver`: `unstable_enablePackageExports: true`, restart with `--reset-cache`, and record
the change in the metro.config.js header comment.** Do not proceed until the app boots.

- [ ] **Step 4: Delete the replaced files**

```bash
git rm apps/mobile/src/auth/client.ts apps/mobile/src/data/api-client.ts apps/mobile/src/data/repositories.ts
```

- [ ] **Step 5: Rewire the session gate**

In `apps/mobile/src/navigation/RootNavigator.tsx`: delete
`import { api } from '../data/api-client';`, add
`import { useSession } from '@heliogrid/data/react';`, and replace the state and `refresh`
block with:

```tsx
const { status } = useSession();

if (status === 'checking') {
  return (
    <View style={styles.boot}>
      <Spinner />
    </View>
  );
}
```

The stack selection becomes `status === 'authenticated' ? <authenticated stack> : <Login>`,
and the `<Stack.Screen name="Login">` render prop drops its `onSignedIn` argument — the
session store now drives the switch. Keep the boot-spinner branch: `SessionStatus` declares
`'checking'` and the real implementation will use it.

- [ ] **Step 6: Rewire the login controller**

In `apps/mobile/src/screens/login/hooks/use-login.ts`: delete
`import { authClient } from '../../../auth/client';`, add
`import { useSession } from '@heliogrid/data/react';`, add `const session = useSession();`
at the top of the hook body, and change the signature to `export function useLogin(): LoginViewModel`
— `onSignedIn` is gone because the store drives navigation.

Inside `sendCode`, replace the `authClient.phoneNumber.sendOtp` call and its error branch:

```ts
const result = await session.requestOtp(`${COUNTRY_CALLING_CODE}${phone}`);
if (!result.ok) {
  setSendFailed(true);
  return;
}
```

Inside `verify`, replace the `authClient.phoneNumber.verify` call and its error branch:

```ts
const result = await session.verifyOtp(`${COUNTRY_CALLING_CODE}${phone}`, code);
if (stepRef.current !== 'otp') return; // user changed number while in flight
if (!result.ok) {
  setOtpFailure(result.failure);
  return;
}
setStep('done');
```

Delete the `doneTimer` `setTimeout(onSignedIn, DONE_DWELL_MS)` line and its cleanup, and
remove `DONE_DWELL_MS` from the domain import if nothing else in the file uses it. Update
`LoginScreen.tsx`'s call site to `useLogin()` and drop the `onSignedIn` prop from its props
type in `apps/mobile/src/screens/login/types.ts` if declared there.

- [ ] **Step 7: Verify no wire imports remain**

```bash
grep -rn "better-auth\|@ts-rest" apps/mobile/src apps/mobile/App.tsx
```

Expected: no output.

- [ ] **Step 8: Verify gates and both simulators**

```bash
pnpm exec biome check --write apps/mobile/src apps/mobile/App.tsx
pnpm lint && pnpm turbo typecheck
pnpm --filter @heliogrid/mobile ios
pnpm --filter @heliogrid/mobile android
```

On **each** simulator: login shows 6 OTP boxes; 10 digits + Continue advances to the OTP
step; 6 digits auto-verifies and the navigator swaps to the Home stack; the gallery screen is
unchanged; Devanagari renders (switch the locale on Home).

- [ ] **Step 9: Stage and commit (owner-gated)**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "refactor(mobile): consume @heliogrid/data, delete src/data and the cookie jar

The keychain adapter is now the TokenStorage implementation — the only
platform-specific piece left in the data path. Screens and styles untouched.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Delete the auth module from `apps/api`

Both clients are already off auth (Tasks 5 and 6), so nothing breaks when the routes vanish.

**Files:**
- Delete: `apps/api/src/modules/auth/` (all 10 files)
- Delete: `apps/api/src/common/guards/session.guard.ts`
- Delete: `apps/api/src/common/decorators/current-claims.decorator.ts`
- Delete: `apps/api/src/common/decorators/public.decorator.ts`
- Delete: `apps/api/src/common/tokens.ts`
- Delete: `apps/api/src/scripts/auth-migrate.ts`
- Modify: `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/package.json`
- Modify: `apps/api/src/modules/health/health.controller.ts` (remove `@Public()`)

- [ ] **Step 1: Delete the files**

```bash
git rm -r apps/api/src/modules/auth
git rm apps/api/src/common/guards/session.guard.ts \
       apps/api/src/common/decorators/current-claims.decorator.ts \
       apps/api/src/common/decorators/public.decorator.ts \
       apps/api/src/common/tokens.ts \
       apps/api/src/scripts/auth-migrate.ts
```

`apps/api/src/common/tokens.ts` goes because `SESSION_RESOLVER` is its only content. If
`guards/` or `decorators/` are now empty directories, git removes them automatically.

- [ ] **Step 2: Rewire the root module**

In `apps/api/src/app.module.ts`: delete the `APP_GUARD` import from `@nestjs/core`, the
`SessionGuard` import, the `AuthModule` import, the `AuthModule` entry in `imports`, and the
entire `providers` array with its comment. Update the module docstring's module list to note
that auth/tenancy returns with its rebuild.

- [ ] **Step 3: Restore plain body parsing in `main.ts`**

Replace `apps/api/src/main.ts`:

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { assertTenancyPrecondition } from './common/db/tenancy-precondition';
import { ENV } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableCors({ origin: ENV.WEB_ORIGIN, credentials: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  // Tenancy precondition (docs/08 §4): a SUPERUSER or BYPASSRLS runtime role makes RLS a
  // silent no-op. Fail at boot rather than serve cross-tenant data that looks correct.
  await assertTenancyPrecondition(app);

  await app.listen(ENV.API_PORT, '0.0.0.0');
}

void bootstrap();
```

`bodyParser: false` plus the manual `express.json` branch existed only so Better Auth's
handler could read the raw stream. With it gone, Nest's default parser is correct and the
`express` import is no longer needed.

- [ ] **Step 4: Remove `@Public()` from the health controller**

With the global guard gone, the decorator no longer exists. Delete its import and its usage
from `apps/api/src/modules/health/health.controller.ts`. Every route is now unauthenticated —
which is accurate: there is no auth.

- [ ] **Step 5: Clean the manifest**

In `apps/api/package.json`: remove `"better-auth"` from dependencies and the
`"auth:migrate"` script. Remove `"express"` only if nothing else imports it —
`grep -rn "from 'express'" apps/api/src` must be empty first. Then `pnpm install`.

- [ ] **Step 6: Drop Better Auth's own tables from the dev database**

Better Auth owned these through its own migrator, so there is no migration to write:

```bash
psql "$DATABASE_ADMIN_URL" -c 'drop table if exists "session","account","verification","member","invitation","organization","user" cascade;'
```

- [ ] **Step 7: Verify the api builds and boots**

```bash
pnpm lint && pnpm turbo typecheck
pnpm --filter @heliogrid/api build
pnpm --filter @heliogrid/api start
```

In a second shell:

```bash
curl -i http://localhost:8084/health/liveness
curl -i http://localhost:8084/api/auth/session
```

Expected: `200` with the liveness body; `404` for the auth path.

- [ ] **Step 8: Stage and commit (owner-gated)**

```bash
git add apps/api pnpm-lock.yaml
git commit -m "feat(api)!: remove the auth module, session guard and Better Auth handler

Owner ruling 2026-08-01: auth is removed to greenfield and rebuilt on a new
architecture in a separate change. tenancy-precondition survives — it inspects role
privileges, not tables, and must protect the rebuild.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Delete auth from `packages/contracts` and re-emit OpenAPI

**REQUIRED SUB-SKILL: invoke `/contract-change` for this task** — it governs every edit to
`packages/contracts` and owns the OpenAPI re-emit and breaking-change judgement.

**Files:**
- Delete: `packages/contracts/src/auth.ts`, `packages/contracts/src/ports/session.ts`
- Modify: `packages/contracts/src/index.ts`, `packages/contracts/src/common.ts`
- Modify: `packages/contracts/openapi/openapi.json` (regenerated, never hand-edited)

- [ ] **Step 1: Delete the auth surface**

```bash
git rm packages/contracts/src/auth.ts packages/contracts/src/ports/session.ts
```

- [ ] **Step 2: Reduce the root router**

Replace `packages/contracts/src/index.ts`:

```ts
import { initContract } from '@ts-rest/core';
import { healthContract } from './health';

export * from './common';
export * from './error';
export * from './health';

const c = initContract();

/**
 * The root API contract. Feature modules mount their routers here — contract FIRST, then
 * implementation; the contract diff is the API review surface (Law 3). Auth and tenancy were
 * removed to greenfield (owner ruling 2026-08-01) and return with their rebuild.
 */
export const apiContract = c.router(
  {
    health: healthContract,
  },
  {
    strictStatusCodes: true,
  },
);

export type ApiContract = typeof apiContract;
```

- [ ] **Step 3: Drop the two guard-shaped schemas from `common.ts`**

In `packages/contracts/src/common.ts` delete `tenantClaimSchema` / `TenantClaim` and
`sessionClaimsSchema` / `SessionClaims` with their block comments — both exist solely for the
session guard that Task 7 deleted. **Change nothing else in this file**: `uiLanguageSchema` is
consumed by `packages/i18n`, `workflowStatusSchema` by both design systems and both galleries.

- [ ] **Step 4: Re-emit OpenAPI**

```bash
pnpm --filter @heliogrid/contracts build
pnpm --filter @heliogrid/contracts openapi
pnpm check:openapi
```

Expected: `check:openapi` green (it rebuilds, re-emits and byte-compares). The committed
`openapi.json` must now describe only the health routes.

- [ ] **Step 5: Verify the workspace**

```bash
pnpm exec biome check --write packages/contracts/src
pnpm lint && pnpm turbo typecheck && pnpm turbo build
```

Expected: green. A failure naming `SessionClaims` means a surviving api file still imports it
— it should have gone with Task 7; delete the stale import.

- [ ] **Step 6: Stage and commit (owner-gated)**

```bash
git add packages/contracts
git commit -m "feat(contracts)!: remove the auth router, session port and claim schemas

Root contract is health only. Business enums and pagination conventions stay —
they carry no auth dependency and are frozen design surface.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Remove auth configuration from `packages/env` and `.env.example`

**Files:**
- Modify: `packages/env/src/schema/api.ts`
- Modify: `.env.example`

- [ ] **Step 1: Delete the four variables from the schema**

In `packages/env/src/schema/api.ts` delete the `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`MSG91_AUTH_KEY` and `MSG91_OTP_TEMPLATE_ID` entries and the MSG91 comment above them.

- [ ] **Step 2: Delete the auth block from `.env.example`**

Remove the `── Auth (Better Auth self-hosted + MSG91 OTP) ──` section with its four
variables, and remove the `auth:migrate` references from the header comment block (the lines
mentioning `BETTER_AUTH_SECRET`, `auth:migrate on an unbuilt tree` and
`pnpm --filter @heliogrid/api auth:migrate`). Leave the Law 9 note at the bottom.

- [ ] **Step 3: Verify**

```bash
pnpm check:env
pnpm lint && pnpm turbo typecheck
```

Then remove the four variables from your local `.env.local` and confirm the api still boots:

```bash
pnpm --filter @heliogrid/api start
```

Expected: boots cleanly; no "missing required environment variable" failure.

- [ ] **Step 4: Stage and commit (owner-gated)**

```bash
git add packages/env .env.example
git commit -m "chore(env): drop BETTER_AUTH_* and MSG91_* with the auth teardown

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Reset `packages/db` to greenfield

**This task deliberately breaks the append-only migration law in CLAUDE.md §6, on the owner's
explicit ruling of 2026-08-01.** Task 13 records that ruling in docs/15 and ADR-0024. Do not
treat this as precedent for any other change.

**Files:**
- Delete: `packages/db/migrations/0001_foundation.sql` … `0006_admin_role_privileges.sql`
- Delete: `packages/db/src/schema/enums.ts`, `identity.ts`, `identity-completion.ts`, `platform.ts`, `index.ts`
- Modify: `packages/db/src/index.ts`, `packages/db/drizzle.config.ts`, `packages/db/CLAUDE.md`

- [ ] **Step 1: Delete the migrations and the schema**

```bash
git rm packages/db/migrations/000*.sql
git rm -r packages/db/src/schema
```

- [ ] **Step 2: Reduce the package barrel**

Replace `packages/db/src/index.ts`:

```ts
export * from './client';
export { uuidv7 } from './uuid';
```

`export * as schema` goes with the schema directory. `client.ts`, `migrate.ts` and `uuid.ts`
survive — the advisory-lock and sha256 ledger machinery in `migrate.ts` is correct and
outlives the reset.

- [ ] **Step 3: Point drizzle.config at nothing**

In `packages/db/drizzle.config.ts` remove the `schema` glob (or point it at
`./src/schema/*.ts`, which now matches nothing — whichever the drizzle-kit version accepts
without erroring). Verify with `pnpm --filter @heliogrid/db exec drizzle-kit --help` if it
complains.

- [ ] **Step 4: Reset the development database**

```bash
psql "$DATABASE_ADMIN_URL" -c 'drop schema public cascade; create schema public;'
psql "$DATABASE_ADMIN_URL" -c 'grant usage on schema public to public;'
pnpm --filter @heliogrid/db build
pnpm --filter @heliogrid/db migrate
```

Expected: the migrator creates its ledger table, finds zero migration files and exits 0.

- [ ] **Step 5: Verify the workspace**

```bash
pnpm exec biome check --write packages/db/src
pnpm lint && pnpm turbo typecheck && pnpm turbo build
```

Expected: green. A failure naming `schema` means an api repository still imports it — that
file should have gone with Task 7.

- [ ] **Step 6: Stage and commit (owner-gated)**

```bash
git add packages/db
git commit -m "feat(db)!: reset to greenfield — delete migrations 0001-0006 and the schema

OWNER RULING 2026-08-01, overriding the append-only migration law in CLAUDE.md §6.
The identity/tenancy spine is re-authored by the auth+tenancy module under Law 9.
client.ts, migrate.ts and uuid.ts survive. See ADR-0024 and docs/15.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Make the invariants honest instead of vacuous

With zero tables the invariants pass by having nothing to compare, and a green run currently
reads as "tenancy is proven". After the reset it is not. This task makes that visible.

**Files:**
- Modify: `tests/invariants/src/tenancy-rls.ts`
- Modify: `tests/invariants/src/run.ts`

- [ ] **Step 1: Remove the seeded behavioural block**

In `tests/invariants/src/tenancy-rls.ts` delete the section that seeds two tenants and two
users and exercises isolation against them (the `insert into tenants` / `insert into users`
statements at roughly lines 66–70 through the cleanup `delete` statements at the end). Keep
the catalog assertions — `assertRlsArmed` and the table scan are driven by
`information_schema` and are correct at zero tables. Update the function's summary log line
so it no longer claims behavioural coverage on `tenants, users`.

- [ ] **Step 2: Add the vacuity banner to the runner**

In `tests/invariants/src/run.ts`, before `await runTenancyInvariants(url);`, add a count of
application tables and the banner:

```ts
const [{ count }] = await countApplicationTables(url);
if (count === 0) {
  console.warn(
    'INVARIANTS VACUOUS: 0 application tables — tenancy is UNPROVEN until the ' +
      'auth/tenancy rebuild lands (owner ruling 2026-08-01). The checks below have ' +
      'nothing to compare and their passing means nothing.',
  );
}
```

Implement `countApplicationTables` in the same file using the existing postgres client import
pattern from `tenancy-rls.ts`:

```sql
select count(*)::int as count from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
  and table_name not in ('__drizzle_migrations')
```

The run still exits 0 — this is a truth banner, not a gate. Do not make it fail CI: the
database is legitimately empty until the rebuild.

- [ ] **Step 3: Verify**

```bash
pnpm exec biome check --write tests/invariants/src
pnpm lint && pnpm turbo typecheck
pnpm turbo test
```

Expected: the banner prints, `invariants green` prints, exit code 0. Confirm with
`echo $?` — a red run here proves nothing until you read *why* it went red.

- [ ] **Step 4: Stage and commit (owner-gated)**

```bash
git add tests/invariants
git commit -m "fix(invariants): say so when there is nothing left to prove

The greenfield reset leaves zero tables, so the four invariants pass vacuously. A
green run must not read as 'tenancy is proven' — it now prints why it does not.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Add the gates that stop the architecture eroding

These land **after** the app migrations because `apps-never-touch-the-wire` would fail against
the pre-migration tree.

**Files:**
- Modify: `.dependency-cruiser.cjs`

- [ ] **Step 1: Add the three new rules**

In `.dependency-cruiser.cjs`, add to the `forbidden` array, matching the surrounding style
(every rule carries a `comment` explaining what it stops and `severity: 'error'`):

```js
{
  name: 'data-lean',
  comment:
    'packages/data is the frontend SDK, not a dumping ground. It owns transport, the ' +
    'client, repositories, session and cache — nothing else. Blocking the visual and ' +
    'persistence layers structurally is what stops it becoming a God package.',
  severity: 'error',
  from: { path: '^packages/data/' },
  to: { path: '^(packages/(db|ui|ui-api|tokens|i18n|adapters)|apps)/' },
},
{
  name: 'data-core-is-framework-free',
  comment:
    'React Query is an ADAPTER over the repositories, confined to packages/data/src/react. ' +
    'Repositories that know no framework are what make the query library replaceable ' +
    'without touching a repository or a screen.',
  severity: 'error',
  from: { path: '^packages/data/src/', pathNot: '^packages/data/src/react/' },
  to: { dependencyTypes: ['npm'], path: '^(react|react-dom|@tanstack/react-query)$' },
},
{
  name: 'apps-never-touch-the-wire',
  comment:
    'Screens reach the network through @heliogrid/data and nothing else. One screen calling ' +
    'the ts-rest client or an auth client directly "just this once" is how a layered data ' +
    'architecture erodes — so it is a build failure, not a review note.',
  severity: 'error',
  from: { path: '^apps/(web|mobile)/' },
  to: { dependencyTypes: ['npm'], path: '^(@ts-rest/|better-auth)' },
},
```

- [ ] **Step 2: Extend `package-index-only`**

In the existing `package-index-only` rule's `to.path` array, add
`'^packages/data/src/(?!index|react/index)'` beside the entries for the other packages, so a
screen cannot deep-import `@heliogrid/data/src/health/repository`.

- [ ] **Step 3: Verify the rules actually fire**

A rule that matches nothing is worse than no rule — `tokens-standalone` sat inert for months
on a path typo. Prove each one with a **throwaway probe file**, never by editing a real file:
`git checkout` on a tracked file would discard any uncommitted work in it, and commits here
are owner-gated so that work may well be uncommitted.

```bash
# should FAIL with data-core-is-framework-free
printf "import { useQuery } from '@tanstack/react-query';\nexport const probe = useQuery;\n" \
  > packages/data/src/__probe.ts
pnpm exec depcruise --config .dependency-cruiser.cjs packages apps
rm packages/data/src/__probe.ts

# should FAIL with apps-never-touch-the-wire
printf "import { initClient } from '@ts-rest/core';\nexport const probe = initClient;\n" \
  > apps/web/lib/__probe.ts
pnpm exec depcruise --config .dependency-cruiser.cjs packages apps
rm apps/web/lib/__probe.ts

# should FAIL with data-lean
printf "export { theme } from '@heliogrid/tokens/theme';\n" > packages/data/src/__probe.ts
pnpm exec depcruise --config .dependency-cruiser.cjs packages apps
rm packages/data/src/__probe.ts
```

Expected: each probe produces a violation naming the expected rule, and `git status` is
unchanged afterwards. If a probe passes, the rule's path pattern is wrong — fix it before
moving on, because a silent rule is the failure mode this step exists to catch.

- [ ] **Step 4: Verify the clean tree passes**

```bash
pnpm lint
```

Expected: green.

- [ ] **Step 5: Stage and commit (owner-gated)**

```bash
git add .dependency-cruiser.cjs
git commit -m "feat(gates): fence the data layer — three dependency-cruiser rules

data-lean stops the God package, data-core-is-framework-free holds the React Query
adapter boundary, apps-never-touch-the-wire makes 'just this once' a build failure.
Each verified to fire by injecting the violation it names.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: Documentation — Law 8, same change not a follow-up

**Files:**
- Create: `docs/adr/0023-packages-data-frontend-sdk.md`, `docs/adr/0024-auth-removal-to-greenfield.md`
- Create: `packages/data/CLAUDE.md`
- Modify: `docs/adr/0010-auth-better-auth-msg91.md`, `docs/adr/README.md`
- Modify: `docs/15-spec-resolutions.md`, `docs/02-system-architecture.md`, `docs/14-build-roadmap.md`, `docs/17-engineering-governance.md`, `docs/forward-compat.md`
- Modify: `apps/web/CLAUDE.md`, `apps/mobile/CLAUDE.md`, `packages/db/CLAUDE.md`, `CLAUDE.md`, `README.md`
- Modify: `scripts/check-adherence.sh`

- [ ] **Step 1: Write ADR-0023**

`docs/adr/0023-packages-data-frontend-sdk.md`, matching the format of the existing ADRs
(Status / Context / Decision / Consequences / Alternatives). Decision content: one package
with two entry points; repositories are interfaces so Track E's PowerSync swap stays a
data-layer change; React Query confined to `src/react/`; `TokenStorage` optional and RN-only
because web's session is an HttpOnly cookie; `@ts-rest/react-query` dropped in favour of the
core client plus a hand-written adapter. Consequences: apps hold no networking code; a
library swap touches one directory; one more build edge in the graph.

- [ ] **Step 2: Write ADR-0024**

`docs/adr/0024-auth-removal-to-greenfield.md`. Status: accepted, supersedes ADR-0010. Record
the owner ruling of 2026-08-01 verbatim, what was deleted, and the **cost stated plainly**:
migrations `0001`–`0006` were deleted against the append-only law, the four invariants are
vacuous until the rebuild, and the login flows run on a walkthrough stub. Name
`packages/data/src/session/types.ts` as the interface the rebuild must implement.

- [ ] **Step 3: Mark ADR-0010 superseded**

In `docs/adr/0010-auth-better-auth-msg91.md` change the status line to
`Superseded by ADR-0024 (2026-08-01)` and add one sentence at the top pointing there. Do not
rewrite its body — a superseded ADR keeps its reasoning. Update the index row in
`docs/adr/README.md` and add rows for 0023 and 0024.

- [ ] **Step 4: Record the ruling in docs/15**

Add a dated entry to `docs/15-spec-resolutions.md` for the append-only override: what was
asked, what was ruled, what it cost, and that it is not precedent.

- [ ] **Step 5: Update the architecture and governance registers**

- `docs/02-system-architecture.md` — add `data/` to the `packages/` listing with a one-line
  role, and add a bullet to the dependency-direction list:
  `packages/data` → `contracts` → `domain`; web and mobile reach the API only through it.
- `docs/17-engineering-governance.md` §5 "Enforced today" — one row per rule from Task 12.
- `docs/14-build-roadmap.md` — Track A reflects the teardown and the pending rebuild.
- `docs/forward-compat.md` — the `mobile` row's repository-interface requirement is now
  satisfied by `packages/data` for **both** platforms, not `apps/mobile` alone.

- [ ] **Step 6: Write `packages/data/CLAUDE.md`**

Use the docs/17 Appendix A template exactly: `What lives here / what must never live here` ·
`Commands` · `Depends on / depended on by` · `Local conventions` · `Landmines` ·
`Definition of done here`. Landmines to record: the zod 3.25.76 pin (a wrong resolution
collapses the client to `never`); Metro package-exports resolution and the
`unstable_enablePackageExports` fallback; React imports belong only in `src/react/`;
`initClient` is called exactly once.

- [ ] **Step 7: Update the app and package CLAUDE.md files**

- `apps/web/CLAUDE.md` — `lib/` no longer holds `api-client.ts`/`auth-client.ts`; the
  "never hand-roll fetch" landmine points at `@heliogrid/data`; add `@heliogrid/data` to the
  `uses:` list.
- `apps/mobile/CLAUDE.md` — the closed `src/` set becomes `{auth,navigation,push,screens,ui}`;
  the repository landmine points at `@heliogrid/data`; delete the cookie-jar landmine (the jar
  moved into the package's transport); note that `src/auth/` now holds only the keychain
  `TokenStorage` implementation.
- `packages/db/CLAUDE.md` — the package is greenfield; the identity spine returns with the
  auth+tenancy module under Law 9.
- Root `CLAUDE.md` §9 — mention `packages/data` where the package roles are listed.
- `README.md` — update the package table and any auth-flow walkthrough.

- [ ] **Step 8: Update the adherence allowlist reason**

In `scripts/check-adherence.sh`, the `COPY_DEBT` entry naming `HomeScreen.tsx` and
`OnboardingScreen.tsx` keeps both files; update the written reason above it to cite this
teardown rather than "rebuilt with auth (auth-tenancy ruling 6)".

- [ ] **Step 9: Verify**

```bash
pnpm lint
grep -rn "auth:migrate\|BETTER_AUTH\|better-auth" docs README.md CLAUDE.md apps/*/CLAUDE.md packages/*/CLAUDE.md
```

Expected: `pnpm lint` green; every remaining match is inside ADR-0010 or ADR-0024, where it
belongs as history.

- [ ] **Step 10: Stage and commit (owner-gated)**

```bash
git add docs README.md CLAUDE.md apps/web/CLAUDE.md apps/mobile/CLAUDE.md packages scripts
git commit -m "docs: ADR-0023 and ADR-0024, register updates for the teardown

ADR-0010 superseded. The append-only override is recorded in docs/15 with its cost
stated: the invariants are vacuous until the auth/tenancy rebuild lands.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 14: Full verification and QA evidence

Nothing is done until it has been run. This task produces the proof.

- [ ] **Step 1: Resync the i18n catalogs**

Deleted and rewritten screens change the extracted message set, and CI fails on a catalog
diff:

```bash
pnpm --filter @heliogrid/i18n extract
git diff --stat packages/i18n
```

Fill any newly empty `msgstr` for `hi` and `mr` — `check:adherence` counts them. If a message
disappeared rather than changed, that is expected; confirm it belonged to a deleted screen.

- [ ] **Step 2: Sweep for orphans**

```bash
pnpm check:unused
```

Read every reported export. Delete the ones your change orphaned; leave anything pre-existing
alone and mention it rather than removing it (CLAUDE.md §4).

- [ ] **Step 3: Run the full gate set**

```bash
pnpm verify
```

Expected: lint · boundaries · typecheck · test · build all green, with the vacuity banner
visible in the test output. If it goes red, read **why** before changing anything — an
earlier gate failing first looks identical to the gate you are watching.

- [ ] **Step 4: Confirm the wire is unreachable from the apps**

```bash
grep -rn "better-auth\|@ts-rest\|initClient" apps --include='*.ts' --include='*.tsx'
```

Expected: no output. This is the architecture's load-bearing claim; verify it rather than
assume it.

- [ ] **Step 5: Run `/qa`**

Invoke the `/qa` skill across web, API, iOS and Android. Scope it to: the login flow on all
three surfaces (phone → OTP → done, resend, change-number, offline), onboarding and home on
web, the navigator stack swap on RN, the gallery and `/design` on both, and `curl` on
`/health/liveness` plus a 404 on `/api/auth/session`. Loop until clean; the run commits its
evidence under `.qa/<run-id>/`.

- [ ] **Step 6: Report honestly**

Write the summary: what was verified and on which surface, what is a deliberate stub (the
walkthrough session), and what is unproven (tenancy, until the rebuild). Small and honest
beats broad and hedged.

- [ ] **Step 7: Stage and commit (owner-gated)**

```bash
git add packages/i18n .qa
git commit -m "chore: resync i18n catalogs and commit QA evidence for the teardown

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task dependency order

```
1 (domain constants)
      ↓
2 (data core) → 3 (session shape) → 4 (react adapter)
                                          ↓
                              5 (web) ────┴──── 6 (mobile)
                                          ↓
                                    7 (api teardown)
                                          ↓
                                    8 (contracts)
                                          ↓
                            9 (env) → 10 (db) → 11 (invariants)
                                          ↓
                              12 (gates) → 13 (docs) → 14 (verify + QA)
```

Tasks 5 and 6 are independent of each other and may run in parallel. Everything else is
strictly sequential: 7 needs both apps off auth, 8 needs 7 (the api imports the auth
contract), 12 needs 5 and 6 (the new rules would fail against the pre-migration tree).
