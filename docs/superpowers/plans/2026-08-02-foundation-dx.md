# Foundation DX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the "developer just uses it" layer — `@heliogrid/forms`, completed error
handling (`ApiError` fields → shared copy in `@heliogrid/i18n` → per-platform wrappers),
and offset+totalCount pagination (contracts revision + two data hooks) — proven via gallery
demos on web and RN, fenced by lint, documented in 1–3-line CLAUDE.md instructions.

**Spec:** `docs/superpowers/specs/2026-08-02-foundation-dx-design.md` (approved 2026-08-02).

**Architecture:** All additive except the contracts pagination revision, which has zero
consumers (verified). New `packages/forms` wraps react-hook-form; error copy centralizes in
`packages/i18n/src/copy` (extractor-swept); hooks land in `@heliogrid/data/react`; nothing
lands in `apps/api` (the repository recipe is an instruction, not a helper).

**Tech Stack:** react-hook-form 7.84.0 · @hookform/resolvers 5.6.0 (registry latest,
2026-08-02) · zod 3.25.76 (repo pin) · @tanstack/react-query 5.101.4 · @lingui/* 5.9.5 ·
react 19.2.3 · typescript 5.8.3.

## Global Constraints (repo constitution — OVERRIDES skill defaults)

- **NO unit tests, ever** (owner directive 2026-07-29). No `.test.*`/`.spec.*` files. Each
  task's verification = the gates (`pnpm turbo typecheck`, `pnpm lint`, `pnpm boundaries`,
  `pnpm turbo build`) + running the surface. The plan's "test cycle" means exactly that.
- **Git is manual.** NO commit steps in this plan. Leave every change in the working tree
  and report what is there. The owner commits when they ask for a commit, in those words.
- **Exact version pins** (`.npmrc` `save-prefix=`). Never `^`/`~`.
- Style gates: 2-space · LF · width 100 · single quotes (JSX double) · `import type` for
  types · no `any`/`!`/`==`/`console.log` · `noUncheckedIndexedAccess` (indexing yields
  `T | undefined`). Run `pnpm exec biome check --write <changed files>` before finishing
  each task. Zero warnings repo-wide — a warning fails `pnpm lint` like an error.
- Copy convention: runtime `<Trans id="English source text" />` — the id IS the English
  string. Never the macro form.
- Instruction lines added to CLAUDE.mds: 1–3 lines each, no war stories.
- After deleting/moving any source file: `pnpm turbo build --force` (stale `tsc -b` output
  otherwise haunts `boundaries`/`knip`).

---

### Task 1: Contracts — offset pagination revision

**Files:**
- Modify: `packages/contracts/src/common.ts:66-82` (the pagination block)
- Modify: `packages/contracts/CLAUDE.md` (Local conventions — one line)
- Modify: `apps/api/CLAUDE.md` (Local conventions — one line)

**Interfaces:**
- Produces: `paginationQuerySchema` (`{ limit: number (1–100, default 25), page: number (≥1, default 1) }`),
  `paginated(item)` → `z.object({ items, totalCount })`, `type Paginated<T> = { items: T[]; totalCount: number }`,
  `DEFAULT_PAGE_LIMIT = 25`, `MAX_PAGE_LIMIT = 100`. Tasks 3, 7, 8 import `Paginated` and
  `DEFAULT_PAGE_LIMIT` from `@heliogrid/contracts`.

- [ ] **Step 1: Confirm zero consumers (safety check before the only non-additive edit)**

Run: `grep -rn "paginationQuerySchema\|paginated(" apps packages --include="*.ts" --include="*.tsx" | grep -v "packages/contracts" | grep -v dist | grep -v node_modules`
Expected: no output. If anything appears, STOP and report — the spec's premise is wrong.

- [ ] **Step 2: Replace the pagination block in `common.ts`**

Replace lines 66–82 (the `Pagination convention` comment through the `paginated()` function)
with:

```ts
/**
 * Pagination convention: offset-based, tenant-scoped, STABLE order (indexed sort key +
 * id tiebreaker — repository recipe in apps/api/CLAUDE.md). Offset over cursor is a
 * 2026-08-02 owner decision (specs/2026-08-02-foundation-dx-design.md §4): per-tenant CRM
 * volumes never hit offset's deep-page cost, and counts / jump-to-page / column sorting
 * are product needs. A hot endpoint may go cursor-based per-route ONLY with an owner ruling.
 */
export const DEFAULT_PAGE_LIMIT = 25;
export const MAX_PAGE_LIMIT = 100;

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  page: z.coerce.number().int().min(1).default(1),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    /** Rows matching the SAME filters — `page × limit < totalCount` derives hasNextPage. */
    totalCount: z.number().int().nonnegative(),
  });
}

/** Wire shape of `paginated()` — keep the two in step (one fact, two artefacts). */
export type Paginated<T> = { items: T[]; totalCount: number };
```

- [ ] **Step 3: Confirm the new symbols are exported from the package index**

Run: `grep -n "common" packages/contracts/src/index.ts`
Expected: a `export * from './common'`-style line (the existing schemas are already public).
If exports are named individually, add `Paginated`, `PaginationQuery`, `DEFAULT_PAGE_LIMIT`,
`MAX_PAGE_LIMIT`, `paginated`, `paginationQuerySchema` to the list.

- [ ] **Step 4: Build, re-emit OpenAPI, run the breaking-change judge**

Run: `pnpm --filter @heliogrid/contracts build && pnpm --filter @heliogrid/contracts openapi && pnpm check:openapi`
Expected: build green; `openapi/openapi.json` diff empty or trivial (no route uses
pagination yet); check:openapi passes. Then `pnpm turbo typecheck` — green repo-wide
(re-proves zero consumers).

- [ ] **Step 5: Instruction lines**

Append to `packages/contracts/CLAUDE.md` § Local conventions:

```markdown
- Pagination is offset + totalCount (`paginationQuerySchema` / `paginated()` /
  `Paginated<T>`). A cursor-based route needs an owner ruling (spec 2026-08-02 §4).
```

Append to `apps/api/CLAUDE.md` § Local conventions:

```markdown
- List endpoints: `orderBy(<sort key> DESC, id DESC)` (stable order, id tiebreaker),
  limit/offset from `paginationQuerySchema`, `totalCount` counted with the SAME `where` —
  never a divergent count query. Recipe: foundation-dx spec §4.2.
```

- [ ] **Step 6: Format and lint**

Run: `pnpm exec biome check --write packages/contracts/src/common.ts && pnpm lint`
Expected: clean.

---

### Task 2: `@heliogrid/data` — `ApiError` carries the whole envelope

**Files:**
- Modify: `packages/data/src/errors/errors.ts` (full replacement below)
- Modify: `packages/data/src/index.ts` (add `ApiErrorDetail` type export)

**Interfaces:**
- Produces: `ApiError` with `readonly code: string` (default `'UNKNOWN'` when the body
  wasn't the envelope), `readonly details?: readonly ApiErrorDetail[]`,
  `readonly requestId?: string`. `ApiErrorDetail = { path: string; issue: string }`.
  Constructor: `new ApiError(status, message, envelope?)` — third arg optional so existing
  call sites compile. Tasks 4, 7, 8 rely on `error.code` / `error.details` / `error.requestId`.

- [ ] **Step 1: Find every existing construction site**

Run: `grep -rn "new ApiError\|new UnauthorizedError" apps packages --include="*.ts" --include="*.tsx" | grep -v dist`
Expected: only `packages/data/src/errors/errors.ts` (and possibly
`packages/data/src/session/walkthrough.ts`). All keep compiling because the new
constructor arg is optional. If a site passes a third argument already, STOP and report.

- [ ] **Step 2: Replace `errors.ts`**

```ts
import { openErrorEnvelopeSchema } from '@heliogrid/contracts';

export interface ApiErrorDetail {
  path: string;
  issue: string;
}

interface EnvelopeFields {
  code?: string;
  details?: readonly ApiErrorDetail[];
  requestId?: string;
}

/** A non-2xx the server described with the canonical error envelope. */
export class ApiError extends Error {
  readonly status: number;
  /**
   * UPPER_SNAKE envelope code ('VALIDATION_FAILED', route-specific literals…).
   * 'UNKNOWN' when the body was not the envelope (e.g. a proxy's HTML error page) —
   * apiErrorContent then falls back to `message`, never to wrong copy.
   */
  readonly code: string;
  readonly details?: readonly ApiErrorDetail[];
  readonly requestId?: string;

  constructor(status: number, message: string, envelope?: EnvelopeFields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope?.code ?? 'UNKNOWN';
    this.details = envelope?.details;
    this.requestId = envelope?.requestId;
  }
}

/** Named separately so a caller can branch on "signed out" without matching on 401. */
export class UnauthorizedError extends ApiError {
  constructor(message: string, envelope?: EnvelopeFields) {
    super(401, message, envelope);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Parse with the contract's OWN schema so no caller hand-declares the envelope shape.
 * The human-safe copy is on the thrown ApiError; code/details/requestId ride along for
 * apiErrorContent (i18n) and applyServerErrors (forms).
 */
export function toApiError(res: { status: number; body: unknown }): ApiError {
  const parsed = openErrorEnvelopeSchema.safeParse(res.body);
  const message = parsed.success ? parsed.data.error.message : `request failed (${res.status})`;
  const envelope = parsed.success
    ? {
        code: parsed.data.error.code,
        details: parsed.data.error.details,
        requestId: parsed.data.error.requestId,
      }
    : undefined;
  return res.status === 401
    ? new UnauthorizedError(message, envelope)
    : new ApiError(res.status, message, envelope);
}
```

- [ ] **Step 3: Export the detail type**

In `packages/data/src/index.ts`, change the errors export line to:

```ts
export { ApiError, UnauthorizedError } from './errors/errors';
export type { ApiErrorDetail } from './errors/errors';
```

- [ ] **Step 4: Verify**

Run: `pnpm turbo typecheck build --filter=@heliogrid/data... && pnpm exec biome check --write packages/data/src/errors/errors.ts packages/data/src/index.ts && pnpm lint`
Expected: green.

---

### Task 3: `@heliogrid/data/react` — `usePaginatedList` + `usePagedList`

**Files:**
- Create: `packages/data/src/react/use-paginated-list.ts`
- Create: `packages/data/src/react/use-paged-list.ts`
- Modify: `packages/data/src/react/index.ts` (two export lines)
- Modify: `packages/data/CLAUDE.md` (one instruction line)

**Interfaces:**
- Consumes: `Paginated<T>`, `DEFAULT_PAGE_LIMIT` from `@heliogrid/contracts` (Task 1).
- Produces:
  `usePaginatedList<TItem extends { id: string }>({ queryKey, fetchPage, enabled? })` →
  `{ items, totalCount, status, error, hasNextPage, fetchNextPage, isFetchingNextPage, refetch }`;
  `usePagedList<TItem>({ queryKey, fetchPage, page, limit?, enabled? })` →
  `{ items, totalCount, pageCount, status, error, isPlaceholderData, refetch }`.
  Both take `fetchPage: (page: number) => Promise<Paginated<TItem>>`. Tasks 7/8 call these.

- [ ] **Step 1: Write `use-paginated-list.ts`**

```ts
'use client';
import type { Paginated } from '@heliogrid/contracts';
import { type QueryKey, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface PaginatedListOptions<TItem extends { id: string }> {
  queryKey: QueryKey;
  fetchPage: (page: number) => Promise<Paginated<TItem>>;
  enabled?: boolean;
}

/**
 * ACCUMULATING pagination — RN infinite scroll, web load-more (spec §4.3). Flattened
 * `items` dedupe by id: a row inserted mid-scroll shifts pages, and without the dedupe it
 * would render twice. For numbered-pager tables use usePagedList instead.
 */
export function usePaginatedList<TItem extends { id: string }>({
  queryKey,
  fetchPage,
  enabled,
}: PaginatedListOptions<TItem>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const loaded = allPages.reduce((n, page) => n + page.items.length, 0);
      return loaded < lastPage.totalCount ? lastPageParam + 1 : undefined;
    },
    enabled,
  });

  const items = useMemo(
    () => dedupeById(query.data?.pages.flatMap((page) => page.items) ?? []),
    [query.data],
  );

  return {
    items,
    totalCount: query.data?.pages.at(-1)?.totalCount ?? 0,
    status: query.status,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}

function dedupeById<TItem extends { id: string }>(rows: readonly TItem[]): TItem[] {
  const seen = new Set<string>();
  const out: TItem[] = [];
  for (const row of rows) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      out.push(row);
    }
  }
  return out;
}
```

- [ ] **Step 2: Write `use-paged-list.ts`**

```ts
'use client';
import { DEFAULT_PAGE_LIMIT, type Paginated } from '@heliogrid/contracts';
import { keepPreviousData, type QueryKey, useQuery } from '@tanstack/react-query';

interface PagedListOptions<TItem> {
  queryKey: QueryKey;
  fetchPage: (page: number) => Promise<Paginated<TItem>>;
  page: number;
  /** Must match the limit `fetchPage` requests — pageCount is derived from it. */
  limit?: number;
  enabled?: boolean;
}

/**
 * SINGLE-PAGE pagination — web numbered-pager tables (spec §4.3). keepPreviousData keeps
 * the old page rendered while the next loads, so page flips never flash empty. For
 * infinite scroll / load-more use usePaginatedList instead.
 */
export function usePagedList<TItem>({
  queryKey,
  fetchPage,
  page,
  limit = DEFAULT_PAGE_LIMIT,
  enabled,
}: PagedListOptions<TItem>) {
  const query = useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => fetchPage(page),
    placeholderData: keepPreviousData,
    enabled,
  });

  const totalCount = query.data?.totalCount ?? 0;
  return {
    items: query.data?.items ?? [],
    totalCount,
    pageCount: Math.ceil(totalCount / limit),
    status: query.status,
    error: query.error,
    isPlaceholderData: query.isPlaceholderData,
    refetch: query.refetch,
  };
}
```

- [ ] **Step 3: Export from the react index**

Append to `packages/data/src/react/index.ts`:

```ts
export { usePagedList } from './use-paged-list';
export { usePaginatedList } from './use-paginated-list';
```

- [ ] **Step 4: Instruction line**

Append to `packages/data/CLAUDE.md` § Local conventions:

```markdown
- Paginated screens use `usePaginatedList` (accumulating: infinite scroll / load-more,
  dedupes by id) or `usePagedList` (numbered pager, keepPreviousData) from `./react` —
  never hand-wire `useInfiniteQuery` or pagination `useQuery` in an app.
```

- [ ] **Step 5: Verify**

Run: `pnpm turbo typecheck build --filter=@heliogrid/data... && pnpm exec biome check --write packages/data/src/react && pnpm lint`
Expected: green.

---

### Task 4: `@heliogrid/forms` — the headless form package

**Files:**
- Create: `packages/forms/package.json`, `packages/forms/tsconfig.json`,
  `packages/forms/CLAUDE.md`, `packages/forms/src/index.ts`,
  `packages/forms/src/use-zod-form.ts`, `packages/forms/src/apply-server-errors.ts`

**Interfaces:**
- Produces: `useZodForm(schema, options?)` → react-hook-form's `UseFormReturn` typed from
  the schema; `applyServerErrors(setError, details)` with
  `details: readonly { path: string; issue: string }[]` (structurally matches
  `ApiErrorDetail` from Task 2 — no import needed); re-exports `Controller`,
  `useFieldArray`, `useWatch` + types. Tasks 5, 7, 8 depend on this package.

- [ ] **Step 1: `package.json`** (react-hook-form/resolvers are REGULAR deps — the
  `@heliogrid/data` + `@ts-rest/core` precedent: apps never list them, which is half the fence)

```json
{
  "name": "@heliogrid/forms",
  "version": "0.0.1",
  "private": true,
  "description": "Headless form layer — the ONLY form-state path for apps/web and apps/mobile (foundation-dx spec §2)",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b"
  },
  "dependencies": {
    "@hookform/resolvers": "5.6.0",
    "react-hook-form": "7.84.0",
    "zod": "3.25.76"
  },
  "peerDependencies": {
    "react": "19.2.3"
  },
  "devDependencies": {
    "@heliogrid/config": "workspace:*",
    "@types/react": "19.2.17",
    "react": "19.2.3",
    "typescript": "5.8.3"
  }
}
```

- [ ] **Step 2: `tsconfig.json`** (DOM lib needed — RHF's field types reference DOM elements)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@heliogrid/config/tsconfig/node-package.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: `src/use-zod-form.ts`**

```ts
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormProps, type UseFormReturn, useForm } from 'react-hook-form';
import type { z } from 'zod';

/**
 * The one way a screen builds a form (foundation-dx spec §2): the CONTRACT's schema — or
 * a .pick()/.omit() of it — drives value types AND validation, so client and server
 * validate the same fact. `mode: 'onTouched'`: errors appear on blur, not per keystroke.
 */
export function useZodForm<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>, 'resolver'>,
): UseFormReturn<z.input<TSchema>, unknown, z.output<TSchema>> {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    ...options,
  });
}
```

- [ ] **Step 4: `src/apply-server-errors.ts`**

```ts
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/** Envelope detail shape — structurally matches @heliogrid/data's ApiErrorDetail. */
interface ServerErrorDetail {
  path: string;
  issue: string;
}

/**
 * A server VALIDATION_FAILED lands on the exact fields it names — never a dead-end toast
 * (spec §2.1). Rare in practice: the client pre-validates with the same schema.
 */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  details: readonly ServerErrorDetail[],
): void {
  for (const detail of details) {
    setError(detail.path as Path<T>, { type: 'server', message: detail.issue });
  }
}
```

- [ ] **Step 5: `src/index.ts`**

```ts
/**
 * @heliogrid/forms — headless form layer (foundation-dx spec §2). Apps import ONLY this
 * package for form state: react-hook-form directly is fenced (dep-cruiser
 * `forms-through-heliogrid-forms` + Biome noRestrictedImports).
 */
export { applyServerErrors } from './apply-server-errors';
export { useZodForm } from './use-zod-form';
export { Controller, useFieldArray, useWatch } from 'react-hook-form';
export type { Control, FieldErrors, SubmitHandler, UseFormReturn } from 'react-hook-form';
```

- [ ] **Step 6: `CLAUDE.md`**

```markdown
# @heliogrid/forms — headless form layer (the ONLY form-state path for apps)

## What lives here / what must never live here
- `useZodForm` (contract schema → typed form state), `applyServerErrors` (envelope
  details → field errors), react-hook-form re-exports (`Controller`, `useFieldArray`…).
- NEVER: UI components, copy/strings, data fetching, an environment read, schema
  definitions (schemas live in @heliogrid/contracts).

## Commands
pnpm --filter @heliogrid/forms build | typecheck     # tsc -b

## Depends on / depended on by
uses: react-hook-form, @hookform/resolvers, zod (peer: react)
used by: apps/web, apps/mobile. Apps importing react-hook-form directly is a lint failure.

## Landmines
- `zod` pinned `3.25.76` (repo-wide pin — ts-rest peer collapse otherwise).
- If `zodResolver` generics reject the Zod-3 schema after a dep bump, pin
  `@hookform/resolvers` back to the 3.x line (3.10.0) — same import path.

## Definition of done here
build/typecheck/lint green · consumed by BOTH platforms' gallery form demo (Law 7) ·
the demo walked in a browser and on both simulators.
```

- [ ] **Step 7: Install and verify**

Run: `pnpm install && pnpm turbo build typecheck --filter=@heliogrid/forms && pnpm exec biome check --write packages/forms && pnpm lint`
Expected: install resolves 7.84.0/5.6.0 exactly; build green. If `useZodForm`'s return
type errors on the resolver, apply the CLAUDE.md landmine (resolvers 3.10.0) and re-run.

---

### Task 5: The fence — apps must not import react-hook-form directly

**Files:**
- Modify: `.dependency-cruiser.cjs` (new rule after `apps-never-touch-the-wire`, ~line 117)
- Modify: `biome.json` (new override in the `overrides` array)

**Interfaces:**
- Consumes: `@heliogrid/forms` existing (Task 4).
- Produces: two gates Tasks 7/8 must not trip.

- [ ] **Step 1: dep-cruiser rule** — insert after the `apps-never-touch-the-wire` rule
  object (both match forms, same reason documented there):

```js
{
  name: 'forms-through-heliogrid-forms',
  severity: 'error',
  comment:
    'Screens build form state through @heliogrid/forms and nothing else (foundation-dx spec §2.2). A screen importing react-hook-form directly re-opens per-screen form wiring — the drift the package exists to end.',
  from: { path: '^apps/(web|mobile)/' },
  to: { path: '(^|/)node_modules/(react-hook-form|@hookform)/|^(react-hook-form($|/)|@hookform/)' },
},
```

- [ ] **Step 2: Biome override** — append to the `overrides` array in `biome.json`.
  CRITICAL: a Biome override REPLACES the global `noRestrictedImports` options for matched
  files, so the two global `zod/v4` bans MUST be repeated here or the override silently
  drops them inside apps:

```json
{
  "includes": ["apps/web/**", "apps/mobile/**"],
  "linter": {
    "rules": {
      "style": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": {
              "zod/v4": "Zod 4 is banned until ts-rest ships stable Zod-4 support (docs/03 §4, spike S3). Import from 'zod' only.",
              "zod/v4-mini": "Zod 4 is banned until ts-rest ships stable Zod-4 support (docs/03 §4, spike S3). Import from 'zod' only.",
              "react-hook-form": "Import useZodForm/Controller from '@heliogrid/forms' — the fenced form layer (foundation-dx spec §2.2).",
              "@hookform/resolvers/zod": "zodResolver is wired inside @heliogrid/forms' useZodForm — import that instead (foundation-dx spec §2.2)."
            }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 3: Prove BOTH gates fire (a rule that matches nothing is worse than no rule
  — data package's own lesson)**

```bash
printf "import 'react-hook-form';\nimport 'zod/v4';\n" > apps/web/lib/fence-probe.ts
pnpm lint; pnpm boundaries
```

Expected: `pnpm lint` fails with BOTH messages (react-hook-form AND zod/v4 — the second
proves the override didn't drop the global ban); `pnpm boundaries` fails with
`forms-through-heliogrid-forms`. Read WHY each went red — a probe syntax error or an
earlier failing gate looks identical to a catch.

- [ ] **Step 4: Remove the probe, confirm green**

```bash
rm apps/web/lib/fence-probe.ts
pnpm lint && pnpm boundaries
```

Expected: both green.

---

### Task 6: `@heliogrid/i18n` — the shared error-copy module

**Files:**
- Create: `packages/i18n/src/copy/api-error.tsx`
- Modify: `packages/i18n/package.json` (peers + devDeps), `packages/i18n/tsconfig.json`
  (jsx + tsx include), `packages/i18n/src/index.ts` (export), `packages/i18n/lingui.config.js`
  (one include line), `packages/i18n/CLAUDE.md` (charter line),
  `packages/i18n/src/locales/{hi,mr}/messages.po` (translations after extract)

**Interfaces:**
- Consumes: `BaseErrorCode` from `@heliogrid/contracts`.
- Produces: `apiErrorContent(error: { code: string; message: string; requestId?: string }): ReactElement`
  and `type ApiErrorLike`, exported from `@heliogrid/i18n`. Tasks 7/8 wrap it.

- [ ] **Step 1: `package.json` edits** — add to `peerDependencies`:
  `"@lingui/react": "5.9.5", "react": "19.2.3"`; add to `devDependencies`:
  `"@lingui/react": "5.9.5", "@types/react": "19.2.17", "react": "19.2.3"`.
  (Peers, not deps — React context singletons; mirrors `@heliogrid/data`.)

- [ ] **Step 2: `tsconfig.json`** — replace with:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@heliogrid/config/tsconfig/node-package.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "references": [{ "path": "../contracts" }]
}
```

- [ ] **Step 3: `src/copy/api-error.tsx`**

```tsx
import type { BaseErrorCode } from '@heliogrid/contracts';
import { Trans } from '@lingui/react';
import type { ReactElement } from 'react';

/**
 * The ONE definition of base error-code copy (foundation-dx spec §3.2), swept by the
 * Lingui extractor (lingui.config.js). Record over the contracts enum: a new base code
 * fails compile HERE, once, for both platforms. Client-only — <Trans> needs the provider.
 */
const COPY: Record<BaseErrorCode, ReactElement> = {
  VALIDATION_FAILED: <Trans id="Some fields need attention. Check the form and retry." />,
  UNAUTHENTICATED: <Trans id="You're signed out. Sign in to continue." />,
  FORBIDDEN: <Trans id="You don't have access to do that." />,
  ENTITLEMENT_BLOCKED: <Trans id="Your current plan doesn't include this." />,
  NOT_FOUND: <Trans id="That record isn't available." />,
  CONFLICT: <Trans id="Someone changed this while you were editing. Refresh and retry." />,
  DOMAIN_RULE_VIOLATION: <Trans id="That change isn't allowed here." />,
  RATE_LIMITED: <Trans id="Too many attempts. Wait a moment and retry." />,
  INTERNAL: <Trans id="Something went wrong on our side. Try again." />,
};

export interface ApiErrorLike {
  code: string;
  message: string;
  requestId?: string;
}

/**
 * Structural arg on purpose — no @heliogrid/data dependency. Unknown/route-specific codes
 * fall back to the server's human-safe message until the owning module adds copy.
 */
export function apiErrorContent(error: ApiErrorLike): ReactElement {
  const known = (COPY as Partial<Record<string, ReactElement>>)[error.code];
  if (!known) {
    return <>{error.message}</>;
  }
  if (error.code === 'INTERNAL' && error.requestId !== undefined) {
    return (
      <>
        {known} · Ref: {error.requestId}
      </>
    );
  }
  return known;
}
```

- [ ] **Step 4: Export** — append to `packages/i18n/src/index.ts`:

```ts
export type { ApiErrorLike } from './copy/api-error';
export { apiErrorContent } from './copy/api-error';
```

- [ ] **Step 5: Extractor include** — in `packages/i18n/lingui.config.js`, add to the
  `include` array (scoped to copy/ so compiled catalogs are never swept):

```js
'<rootDir>/src/copy',
```

- [ ] **Step 6: Extract, translate, compile**

Run: `pnpm --filter @heliogrid/i18n extract`
Expected: 9 new msgids in all three .po files; `en` auto-fills; `hi`/`mr` empty.
Fill `hi` and `mr` `msgstr` values:

| English (msgid) | hi | mr |
| --- | --- | --- |
| Some fields need attention. Check the form and retry. | कुछ फ़ील्ड्स पर ध्यान देना ज़रूरी है। फ़ॉर्म जाँचकर फिर से कोशिश करें। | काही फील्डकडे लक्ष देणे आवश्यक आहे. फॉर्म तपासून पुन्हा प्रयत्न करा. |
| You're signed out. Sign in to continue. | आप साइन आउट हैं। जारी रखने के लिए साइन इन करें। | तुम्ही साइन आउट आहात. सुरू ठेवण्यासाठी साइन इन करा. |
| You don't have access to do that. | आपके पास यह करने की अनुमति नहीं है। | तुम्हाला हे करण्याची परवानगी नाही. |
| Your current plan doesn't include this. | आपके मौजूदा प्लान में यह शामिल नहीं है। | तुमच्या सध्याच्या प्लॅनमध्ये हे समाविष्ट नाही. |
| That record isn't available. | वह रिकॉर्ड उपलब्ध नहीं है। | ते रेकॉर्ड उपलब्ध नाही. |
| Someone changed this while you were editing. Refresh and retry. | आपके संपादन के दौरान किसी और ने इसे बदल दिया। रीफ़्रेश करके फिर से कोशिश करें। | तुम्ही संपादित करत असताना कोणीतरी हे बदलले. रिफ्रेश करून पुन्हा प्रयत्न करा. |
| That change isn't allowed here. | यह बदलाव यहाँ मान्य नहीं है। | हा बदल येथे अनुमत नाही. |
| Too many attempts. Wait a moment and retry. | बहुत अधिक प्रयास हो गए। थोड़ी देर रुककर फिर से कोशिश करें। | खूप प्रयत्न झाले. थोडा वेळ थांबून पुन्हा प्रयत्न करा. |
| Something went wrong on our side. Try again. | हमारी ओर से कुछ गड़बड़ हो गई। फिर से कोशिश करें। | आमच्याकडून काहीतरी चूक झाली. पुन्हा प्रयत्न करा. |

Then: `pnpm install && pnpm --filter @heliogrid/i18n build`
Expected: compile + tsc green. Run extract AGAIN → `git diff --stat packages/i18n/src/locales` shows no further change (determinism check).

- [ ] **Step 7: Charter line** — append to `packages/i18n/CLAUDE.md` § What lives here:

```markdown
- Shared cross-platform copy modules in `src/copy/` — enum-keyed `Record` of static
  `<Trans id>`, extractor-swept. Screen-specific copy stays in its screen.
```

- [ ] **Step 8: Verify** — `pnpm turbo typecheck build --filter=@heliogrid/i18n... && pnpm lint`
Expected: green.

---

### Task 7: Web — `ApiErrorText` wrapper + gallery pattern demos

**Files:**
- Modify: `apps/web/package.json` (add `"@heliogrid/forms": "workspace:*"` to dependencies)
- Create: `apps/web/lib/ApiErrorText.tsx`
- Create: `apps/web/features/design-reference/gallery/components/PatternsSections.tsx`
- Modify: `apps/web/features/design-reference/gallery/components/index.ts`,
  `apps/web/features/design-reference/gallery/GalleryScreen.tsx` (render the new sections)
- Modify: `apps/web/CLAUDE.md` (three instruction lines)

**Interfaces:**
- Consumes: `apiErrorContent`/`ApiErrorLike` (Task 6), `ApiError` (Task 2),
  `useZodForm`/`applyServerErrors`/`Controller` (Task 4), `usePaginatedList`/`usePagedList`
  (Task 3), gallery `Section`/`Demo` chrome (existing).
- Produces: `ApiErrorText({ error: ApiError })` in `apps/web/lib/` — the component every
  web screen renders for API failures.

- [ ] **Step 1: Read the local idioms first** (10 minutes that prevent three lint rounds)
  — `apps/web/features/design-reference/gallery/components/FormsSections.tsx` for the
  `_ds` `Input` prop names (label/value/onChange/error — mirror EXACTLY what it passes),
  and `grep -rn "danger\|error" apps/web/app/login --include='*.tsx'` for the error-text
  class names the login flow uses. Use those classes in Step 2 — do not invent new ones.

- [ ] **Step 2: `apps/web/lib/ApiErrorText.tsx`**

```tsx
'use client';
import type { ApiError } from '@heliogrid/data';
import { apiErrorContent } from '@heliogrid/i18n';

/** Presentation only — copy lives in @heliogrid/i18n src/copy (spec §3.2). Client-only. */
export function ApiErrorText({ error }: { error: ApiError }) {
  return <p className={ERROR_TEXT_CLASSES}>{apiErrorContent(error)}</p>;
}
```

where `ERROR_TEXT_CLASSES` is replaced inline by the exact class string found in Step 1
(a `const` is unnecessary — put the string in the JSX).

- [ ] **Step 3: `PatternsSections.tsx`** — three sections. Adapt ONLY the `Input` prop
  wiring to what Step 1 found; everything else lands as written:

```tsx
'use client';
import { phoneE164Schema } from '@heliogrid/contracts';
import { ApiError } from '@heliogrid/data';
import { usePagedList, usePaginatedList } from '@heliogrid/data/react';
import { applyServerErrors, Controller, useZodForm } from '@heliogrid/forms';
import { Button, Input } from '@heliogrid/ui';
import { useState } from 'react';
import { z } from 'zod';
import { ApiErrorText } from '../../../../lib/ApiErrorText';
import { Demo, Section } from './GalleryChrome';

/** Foundation-pattern demos (foundation-dx spec §5) — the live examples screens copy. */

const demoLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: phoneE164Schema,
});

const DEMO_ROWS = Array.from({ length: 12 }, (_, i) => ({
  id: `row-${i + 1}`,
  label: `Demo lead ${i + 1}`,
}));
const DEMO_LIMIT = 5;

function fetchDemoPage(page: number) {
  const start = (page - 1) * DEMO_LIMIT;
  return new Promise<{ items: (typeof DEMO_ROWS)[number][]; totalCount: number }>((resolve) => {
    setTimeout(() => {
      resolve({ items: DEMO_ROWS.slice(start, start + DEMO_LIMIT), totalCount: DEMO_ROWS.length });
    }, 300);
  });
}

const DEMO_ERRORS = [
  new ApiError(403, 'forbidden', { code: 'FORBIDDEN', requestId: 'req_demo1' }),
  new ApiError(500, 'boom', { code: 'INTERNAL', requestId: 'req_demo2' }),
  new ApiError(409, 'Lead already won.', { code: 'LEAD_ALREADY_WON', requestId: 'req_demo3' }),
];

export function PatternsSections() {
  return (
    <>
      <FormPatternSection />
      <PaginationPatternSection />
      <ErrorCopySection />
    </>
  );
}

function FormPatternSection() {
  const form = useZodForm(demoLeadSchema);
  const [submitted, setSubmitted] = useState('');

  const submit = form.handleSubmit((values) => {
    setSubmitted(`${values.name} · ${values.phone}`);
  });

  const simulateServerReject = () => {
    applyServerErrors(form.setError, [
      { path: 'phone', issue: 'phone already exists on another lead' },
    ]);
  };

  return (
    <Section title="Pattern — useZodForm (contract schema drives validation)">
      <form onSubmit={submit} noValidate>
        <div className="ds-row">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Input
                label="Name"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <Input
                label="Phone (E.164)"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
        <div className="ds-row">
          <Button size="md" type="submit">
            Save
          </Button>
          <Button size="md" variant="secondary" type="button" onClick={simulateServerReject}>
            Simulate server VALIDATION_FAILED
          </Button>
        </div>
        {submitted !== '' && <span className="ds-value">submitted: {submitted}</span>}
      </form>
    </Section>
  );
}

function PaginationPatternSection() {
  const accumulating = usePaginatedList({
    queryKey: ['gallery', 'patterns', 'accumulating'],
    fetchPage: fetchDemoPage,
  });
  const [page, setPage] = useState(1);
  const paged = usePagedList({
    queryKey: ['gallery', 'patterns', 'paged'],
    fetchPage: fetchDemoPage,
    page,
    limit: DEMO_LIMIT,
  });

  return (
    <Section title="Pattern — usePaginatedList (load more) + usePagedList (pager)">
      <Demo label={`load-more · ${accumulating.items.length}/${accumulating.totalCount}`}>
        <ul>
          {accumulating.items.map((row) => (
            <li key={row.id}>{row.label}</li>
          ))}
        </ul>
        {accumulating.hasNextPage === true && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => accumulating.fetchNextPage()}
            loading={accumulating.isFetchingNextPage}
          >
            Load more
          </Button>
        )}
      </Demo>
      <Demo label={`pager · page ${page} of ${paged.pageCount} · ${paged.totalCount} total`}>
        <ul>
          {paged.items.map((row) => (
            <li key={row.id}>{row.label}</li>
          ))}
        </ul>
        <div className="ds-row">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= paged.pageCount}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </Demo>
    </Section>
  );
}

function ErrorCopySection() {
  return (
    <Section title="Pattern — ApiErrorText (copy from @heliogrid/i18n, never hand-written)">
      {DEMO_ERRORS.map((error) => (
        <Demo key={error.code} label={error.code}>
          <ApiErrorText error={error} />
        </Demo>
      ))}
    </Section>
  );
}
```

- [ ] **Step 4: Wire into the gallery** — add `PatternsSections` to
  `components/index.ts` exports and render `<PatternsSections />` in `GalleryScreen.tsx`
  alongside the existing section components (match how `FormsSections` is rendered).

- [ ] **Step 5: Instruction lines** — append to `apps/web/CLAUDE.md` conventions section:

```markdown
- Forms: `useZodForm(<contract schema>)` from `@heliogrid/forms`; wire fields with its
  `Controller`; map server rejections with `applyServerErrors`. react-hook-form directly
  is a lint failure. Live example: design-reference gallery, Patterns sections.
- API failures render `<ApiErrorText error={e} />` (lib/ApiErrorText.tsx) — never a
  hand-written failure string. Forms branch VALIDATION_FAILED through applyServerErrors first.
- Copy BOTH platforms need lives in `packages/i18n/src/copy` (extractor-swept, enum-keyed
  Record). Screen-specific copy stays in its screen. Platform files hold presentation only.
```

- [ ] **Step 6: Verify in the browser** — `pnpm install`, start the web dev server
  (`.claude/launch.json` config), open `/design/gallery`:
  invalid phone → error on blur; valid submit → `submitted:` line; "Simulate server
  VALIDATION_FAILED" → error lands on the phone field; load-more accumulates 5→10→12 and
  the button disappears; pager Prev/Next moves without empty flash; error section shows
  translated copy, `Ref: req_demo2` on INTERNAL, raw message for `LEAD_ALREADY_WON`.
  Then `pnpm lint && pnpm boundaries && pnpm turbo typecheck build`.
Expected: all green, all behaviors observed.

---

### Task 8: Mobile — `ApiErrorText` wrapper + gallery pattern demos

**Files:**
- Modify: `apps/mobile/package.json` (add `"@heliogrid/forms": "workspace:*"` to dependencies)
- Create: `apps/mobile/src/lib/ApiErrorText.tsx`
- Create: `apps/mobile/src/screens/gallery/components/PatternsSections.tsx`
- Modify: `apps/mobile/src/screens/gallery/components/index.ts`,
  `apps/mobile/src/screens/gallery/GalleryScreen.tsx`
- Modify: `apps/mobile/CLAUDE.md` (three instruction lines)

**Interfaces:**
- Consumes: same as Task 7. Mobile `Input` uses `onChangeText`; copy Task 7's
  `PatternsSections` structure with RN primitives.
- Produces: `ApiErrorText({ error: ApiError })` in `src/lib/` (NOT `src/ui/` — app
  copy wrapper, not a parity-checked _ds component).

- [ ] **Step 1: Read the local idioms** —
  `apps/mobile/src/screens/gallery/components/FormsSections.tsx` for `Input` props
  (`value`/`onChangeText`/`error`…), and
  `apps/mobile/src/screens/login/components/OtpErrorRow.tsx` for the exact `AppText`
  props used for danger-toned copy. Mirror both exactly.

- [ ] **Step 2: `src/lib/ApiErrorText.tsx`**

```tsx
import type { ApiError } from '@heliogrid/data';
import { apiErrorContent } from '@heliogrid/i18n';
import { AppText } from '../ui';

/** Presentation only — copy lives in @heliogrid/i18n src/copy (spec §3.2). */
export function ApiErrorText({ error }: { error: ApiError }) {
  return <AppText /* danger-tone props from OtpErrorRow */>{apiErrorContent(error)}</AppText>;
}
```

with the `AppText` props replaced by the exact ones Step 1 found.

- [ ] **Step 3: `PatternsSections.tsx`** — port Task 7's file (same three sections, same
  `demoLeadSchema`, `DEMO_ROWS`, `fetchDemoPage`, `DEMO_ERRORS` — repeat them locally; the
  duplication is dev-gallery demo data, not shared vocabulary):
  - `Section`/`Row` chrome from `./GalleryChrome`, `AppText`/`Button`/`Input` from `../../../ui`.
  - Form fields: `<Controller … render={({ field, fieldState }) => (<Input value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} … />)} />`.
  - Submit: mobile `Button onClick` (per the gallery's existing usage), calling the same
    `form.handleSubmit` wrapper; render `submitted:` via `AppText`.
  - Pagination: **NO FlatList** — the gallery scrolls in a ScrollView and nesting
    VirtualizedLists errors. Render `items.map(…)` into `AppText` rows + the same
    load-more / Prev-Next buttons as web. The FlatList idiom lives in the CLAUDE.md line.
  - Error section: identical to web's, with the mobile `ApiErrorText` import
    (`../../../lib/ApiErrorText`).

- [ ] **Step 4: Wire into the gallery** — export from `components/index.ts`, render
  `<PatternsSections />` in `GalleryScreen.tsx` with the existing sections.

- [ ] **Step 5: Instruction lines** — append to `apps/mobile/CLAUDE.md` the same three
  lines as Task 7 Step 5, with two mobile adjustments: `ApiErrorText` path is
  `src/lib/ApiErrorText.tsx`, and the forms line ends with: "Paginated screens:
  `FlatList` + `usePaginatedList` (`onEndReached={fetchNextPage}`) — never inside a ScrollView."

- [ ] **Step 6: Verify on both simulators** — `pnpm install`, build and launch the app on
  the iOS and Android simulators (per `apps/mobile` CLAUDE.md commands), open the gallery
  from Home, walk the same behaviors as Task 7 Step 6, plus: switch locale to Hindi on
  Home, return to gallery, confirm the error-copy section renders the Hindi strings
  (Devanagari, i18n DoD). Then `pnpm lint && pnpm boundaries && pnpm turbo typecheck build`.
Expected: all green, all behaviors observed on BOTH simulators.

---

### Task 9: Full verification + `/qa`

**Files:** none (evidence lands in `.qa/<run-id>/` via the skill).

- [ ] **Step 1: The gate set**

Run: `pnpm verify`
Expected: lint · boundaries · typecheck · test · build all green. READ the `test` output:
without a live `DATABASE_URL` the invariants skip loudly — green has then NOT proven
tenancy (nothing in this plan touches schema, so that is acceptable; say so in the report).

- [ ] **Step 2: Hygiene sweeps**

Run: `pnpm check:unused && pnpm --filter @heliogrid/i18n extract && git status --short`
Expected: knip reports no NEW findings versus main; extract leaves the locales unchanged
(the extract-clean CI guard's condition); `git status` shows only this plan's files.

- [ ] **Step 3: Run `/qa`** — invoke the `qa` skill covering: web gallery patterns walk
  (Task 7 Step 6 behaviors), mobile gallery walk on both simulators (Task 8 Step 6
  behaviors including the Hindi check). No API surface is in scope (nothing landed in
  `apps/api`) — state that in the run rather than skipping silently.

- [ ] **Step 4: Report** — list every file in the working tree, the verify/qa evidence,
  and the two deliberate deferrals from the spec: English-fallback Zod messages (§2.4)
  and live-table pagination proof (first real module, §5). NO commit — git is manual.

---

## Self-review (done at authoring time)

- **Spec coverage:** §2 → Tasks 4, 5, 7, 8 · §3 → Tasks 2, 6, 7, 8 · §4 → Tasks 1, 3 ·
  §5 → Tasks 7, 8, 9 · §6 (instruction lines) → folded into Tasks 1, 3, 4, 6, 7, 8.
  `apps/api` correctly receives docs only (spec §7).
- **Known judgment calls:** react-hook-form/resolvers as regular deps of forms (spec §2.2
  said peers) — follows the `@heliogrid/data`/`@ts-rest/core` precedent and strengthens the
  fence (apps never list the packages); forms drops its `@heliogrid/contracts` dependency
  (structural typing suffices). Spec updated to match.
- **Two lookup steps by design** (web error-text classes, mobile AppText danger props):
  the values must MATCH existing screens, so the plan directs reading them rather than
  inventing values that would fail visual review.
